import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql, and, isNotNull, inArray } from "drizzle-orm";
import { db, schema } from "../../db";
import { getWanTaskStatus, pollWanTaskUntilComplete, downloadVideo } from "../../lib/wan-client";
import { createLogger } from "../../lib/logger";

const log = createLogger("recover-wan-tasks");

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const VIDEO_SUBDIR = "videos";

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));
const videoRoot = join(appRoot, UPLOAD_DIR, VIDEO_SUBDIR);

type RecoverableJob = {
  id: string;
  elementId: string;
  imageId: string;
  projectId: string;
  wanTaskId: string;
  status: string;
};

/**
 * Find all jobs that have a WAN task ID but are not in a terminal state.
 * These are jobs that may have been interrupted during processing.
 */
const findRecoverableJobs = (): RecoverableJob[] => {
  const jobs = db
    .select({
      id: schema.generationJobs.id,
      elementId: schema.generationJobs.elementId,
      imageId: schema.generationJobs.imageId,
      wanTaskId: schema.generationJobs.wanTaskId,
      status: schema.generationJobs.status,
      projectId: schema.pages.projectId,
    })
    .from(schema.generationJobs)
    .innerJoin(schema.elements, eq(schema.generationJobs.elementId, schema.elements.id))
    .innerJoin(schema.pages, eq(schema.elements.pageId, schema.pages.id))
    .where(
      and(
        isNotNull(schema.generationJobs.wanTaskId),
        inArray(schema.generationJobs.status, ["queued", "processing"])
      )
    )
    .all();

  return jobs.filter((job): job is RecoverableJob => job.wanTaskId !== null);
};

/**
 * Update job status in database
 */
const updateJobStatus = (
  jobId: string,
  updates: {
    status?: string;
    progress?: number;
    videoUrl?: string | null;
    error?: string | null;
  }
) => {
  db.update(schema.generationJobs)
    .set({
      ...updates,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(schema.generationJobs.id, jobId))
    .run();
};

/**
 * Update element video status
 */
const updateElementVideoStatus = (
  elementId: string,
  updates: { videoStatus?: string; videoUrl?: string | null }
) => {
  db.update(schema.elements)
    .set({
      ...updates,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(schema.elements.id, elementId))
    .run();
};

/**
 * Create video record in media library
 */
const createVideoRecord = async (params: { jobId: string; projectId: string; imageId: string }) => {
  const existing = db
    .select({ id: schema.videos.id })
    .from(schema.videos)
    .where(eq(schema.videos.generationJobId, params.jobId))
    .get();
  if (existing?.id) {
    log.info(
      { jobId: params.jobId, videoId: existing.id },
      "Video record already exists during recovery"
    );
    return existing.id;
  }

  const videoId = crypto.randomUUID();
  const filename = `${params.jobId}.mp4`;
  const storagePath = `${UPLOAD_DIR}/${VIDEO_SUBDIR}/${filename}`;
  const filePath = join(videoRoot, filename);

  let fileSize: number | null = null;
  try {
    const stats = await stat(filePath);
    fileSize = stats.size;
  } catch {
    log.warn({ filePath }, "Could not get video file size during recovery");
  }

  db.insert(schema.videos)
    .values({
      id: videoId,
      projectId: params.projectId,
      generationJobId: params.jobId,
      sourceImageId: params.imageId,
      filename,
      storagePath,
      mimeType: "video/mp4",
      fileSize,
    })
    .run();

  log.info({ videoId, jobId: params.jobId }, "Created video record during recovery");
  return videoId;
};

/**
 * Recover a single job by checking its WAN task status and handling accordingly.
 */
const recoverJob = async (job: RecoverableJob): Promise<void> => {
  log.info({ jobId: job.id, wanTaskId: job.wanTaskId }, "Attempting to recover job");

  try {
    // First, check the current status of the WAN task
    const taskStatus = await getWanTaskStatus(job.wanTaskId);
    log.info(
      { jobId: job.id, wanTaskId: job.wanTaskId, status: taskStatus.status },
      "WAN task status retrieved"
    );

    if (taskStatus.status === "SUCCEEDED") {
      // Task already completed - download the video
      if (!taskStatus.videoUrl) {
        throw new Error("WAN task succeeded but no video URL returned");
      }

      await mkdir(videoRoot, { recursive: true });
      const filePath = join(videoRoot, `${job.id}.mp4`);

      log.info({ jobId: job.id, videoUrl: taskStatus.videoUrl }, "Downloading completed video");
      await downloadVideo(taskStatus.videoUrl, filePath);

      const videoUrl = `/api/videos/${job.id}/file`;
      updateJobStatus(job.id, {
        status: "complete",
        progress: 100,
        videoUrl,
        error: null,
      });
      updateElementVideoStatus(job.elementId, {
        videoStatus: "complete",
        videoUrl,
      });

      // Create video record in media library
      await createVideoRecord({
        jobId: job.id,
        projectId: job.projectId,
        imageId: job.imageId,
      });

      log.info({ jobId: job.id }, "Job recovered successfully - video downloaded");
    } else if (taskStatus.status === "FAILED" || taskStatus.status === "CANCELED") {
      // Task failed - mark job as failed
      updateJobStatus(job.id, {
        status: "failed",
        progress: 0,
        error: `WAN task ${taskStatus.status.toLowerCase()} (recovered)`,
      });
      updateElementVideoStatus(job.elementId, { videoStatus: "failed" });

      log.info(
        { jobId: job.id, status: taskStatus.status },
        "Job marked as failed after recovery check"
      );
    } else if (taskStatus.status === "PENDING" || taskStatus.status === "RUNNING") {
      // Task still in progress - resume polling
      log.info(
        { jobId: job.id, wanTaskId: job.wanTaskId },
        "Resuming polling for in-progress task"
      );

      updateJobStatus(job.id, { status: "processing", progress: 50 });
      updateElementVideoStatus(job.elementId, { videoStatus: "processing" });

      try {
        const result = await pollWanTaskUntilComplete(job.wanTaskId);

        if (!result.videoUrl) {
          throw new Error("WAN task completed without video URL");
        }

        await mkdir(videoRoot, { recursive: true });
        const filePath = join(videoRoot, `${job.id}.mp4`);

        await downloadVideo(result.videoUrl, filePath);

        const videoUrl = `/api/videos/${job.id}/file`;
        updateJobStatus(job.id, {
          status: "complete",
          progress: 100,
          videoUrl,
          error: null,
        });
        updateElementVideoStatus(job.elementId, {
          videoStatus: "complete",
          videoUrl,
        });

        // Create video record in media library
        await createVideoRecord({
          jobId: job.id,
          projectId: job.projectId,
          imageId: job.imageId,
        });

        log.info({ jobId: job.id }, "Job recovered successfully after resumed polling");
      } catch (pollError) {
        const errorMessage = pollError instanceof Error ? pollError.message : String(pollError);
        updateJobStatus(job.id, {
          status: "failed",
          error: `Recovery polling failed: ${errorMessage}`,
        });
        updateElementVideoStatus(job.elementId, { videoStatus: "failed" });

        log.error({ jobId: job.id, err: pollError }, "Failed to recover job during polling");
      }
    } else {
      // Unknown status - mark as failed for safety
      updateJobStatus(job.id, {
        status: "failed",
        error: `Unknown WAN task status: ${taskStatus.status}`,
      });
      updateElementVideoStatus(job.elementId, { videoStatus: "failed" });

      log.warn(
        { jobId: job.id, status: taskStatus.status },
        "Unknown WAN status, marking job as failed"
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error({ jobId: job.id, err: error }, "Failed to recover job");

    updateJobStatus(job.id, {
      status: "failed",
      error: `Recovery failed: ${errorMessage}`,
    });
    updateElementVideoStatus(job.elementId, { videoStatus: "failed" });
  }
};

/**
 * Backfill missing video records for completed jobs.
 * This prevents media library gaps if a worker crashed after updating the element/job.
 */
const backfillCompletedVideos = async (): Promise<void> => {
  const completedJobs = db
    .select({
      id: schema.generationJobs.id,
      imageId: schema.generationJobs.imageId,
      projectId: schema.pages.projectId,
      videoUrl: schema.generationJobs.videoUrl,
    })
    .from(schema.generationJobs)
    .innerJoin(schema.elements, eq(schema.generationJobs.elementId, schema.elements.id))
    .innerJoin(schema.pages, eq(schema.elements.pageId, schema.pages.id))
    .where(eq(schema.generationJobs.status, "complete"))
    .all();

  for (const job of completedJobs) {
    const hasVideoUrl = Boolean(job.videoUrl);
    if (!hasVideoUrl) continue;
    const existing = db
      .select({ id: schema.videos.id })
      .from(schema.videos)
      .where(eq(schema.videos.generationJobId, job.id))
      .get();
    if (existing?.id) continue;

    await createVideoRecord({
      jobId: job.id,
      projectId: job.projectId,
      imageId: job.imageId,
    });
  }
};

/**
 * Main recovery function - finds all recoverable jobs and processes them.
 * Call this on worker startup to recover from crashes/restarts.
 */
export const recoverPendingWanTasks = async (): Promise<void> => {
  log.info("Starting WAN task recovery check");

  const recoverableJobs = findRecoverableJobs();

  if (recoverableJobs.length === 0) {
    log.info("No recoverable jobs found");
    return;
  }

  log.info({ count: recoverableJobs.length }, "Found recoverable jobs");

  // Process jobs sequentially to avoid overwhelming the WAN API
  for (const job of recoverableJobs) {
    await recoverJob(job);
  }

  // Ensure any completed jobs that missed media records are backfilled
  try {
    await backfillCompletedVideos();
  } catch (error) {
    log.error({ err: error }, "Failed to backfill completed video records");
  }

  log.info({ count: recoverableJobs.length }, "WAN task recovery complete");
};
