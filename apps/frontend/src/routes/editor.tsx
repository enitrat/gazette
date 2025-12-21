import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "@/stores/auth-store";
import { useElementsStore } from "@/stores/elements-store";
import { usePagesStore } from "@/stores/pages-store";
import { LeftSidebar } from "@/components/editor/LeftSidebar";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { Canvas } from "@/components/editor/Canvas";
import { EditorToolbar } from "@/components/layout/EditorToolbar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { DialogManager } from "@/components/dialogs";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { CreateElement } from "@gazette/shared";

export const Route = createFileRoute("/editor")({
  component: EditorComponent,
});

function EditorComponent() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const project = useAuthStore((state) => state.project);
  const currentPageId = usePagesStore((state) => state.currentPageId);
  const createElement = useElementsStore((state) => state.createElement);
  const fetchElements = useElementsStore((state) => state.fetchElements);
  const createPage = usePagesStore((state) => state.createPage);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Get elements to check for active generation jobs
  const elements = useElementsStore(useShallow((state) => state.elements));

  // Check if there are any elements with pending/processing video status
  const hasActiveGeneration = useMemo(
    () =>
      elements.some(
        (el) =>
          el.type === "image" && (el.videoStatus === "pending" || el.videoStatus === "processing")
      ),
    [elements]
  );

  // Auto-refresh elements when there are active generation jobs
  useEffect(() => {
    if (!hasActiveGeneration || !currentPageId) return;

    const interval = setInterval(() => {
      fetchElements(currentPageId);
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [hasActiveGeneration, currentPageId, fetchElements]);

  // Enable keyboard shortcuts for the editor
  useKeyboardShortcuts({ enabled: true });

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag end - create elements or pages
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !project?.id || !currentPageId) {
      return;
    }

    const dragData = active.data.current;
    const dropData = over.data.current;

    // Only handle drops on the canvas page
    if (!dropData?.pageId) {
      return;
    }

    // Handle element creation (text elements)
    if (dragData?.type === "element") {
      const { elementType, defaultSize } = dragData;

      // Default content for each element type
      const defaultContent: Record<string, string> = {
        headline: "Headline Text",
        subheading: "Subheading Text",
        caption: "Caption text goes here. Double-click to edit.",
      };

      // Validate element type
      if (!["headline", "subheading", "caption"].includes(elementType)) {
        console.error("Invalid element type:", elementType);
        return;
      }

      // Create the element data - type must be one of the specific text types
      const elementData: CreateElement = {
        type: elementType as "headline" | "subheading" | "caption",
        position: {
          x: 100, // Default position - center of page
          y: 100,
          width: defaultSize.width,
          height: defaultSize.height,
        },
        content: defaultContent[elementType] || "Text",
      };

      try {
        await createElement(dropData.pageId, elementData);
      } catch (error) {
        console.error("Failed to create element:", error);
      }
    }

    // Handle media drops (images and videos)
    if (dragData?.type === "media") {
      const { imageId, videoId, videoUrl, sourceImageId } = dragData;

      // If this is a video drop (has videoId), create element with video
      if (videoId && videoUrl) {
        const elementData: CreateElement = {
          type: "image",
          position: {
            x: 100,
            y: 100,
            width: 300,
            height: 200,
          },
          // Use the source image if available for the thumbnail
          imageId: sourceImageId || undefined,
          videoUrl,
          videoStatus: "complete",
        };

        try {
          await createElement(dropData.pageId, elementData);
        } catch (error) {
          console.error("Failed to create video element:", error);
        }
      } else if (imageId) {
        // This is an image drop
        const elementData: CreateElement = {
          type: "image",
          position: {
            x: 100,
            y: 100,
            width: 300,
            height: 200,
          },
          imageId,
        };

        try {
          await createElement(dropData.pageId, elementData);
        } catch (error) {
          console.error("Failed to create image element:", error);
        }
      }
    }

    // Handle template drops (create new page)
    if (dragData?.type === "template") {
      const { templateId } = dragData;

      try {
        await createPage(project.id, templateId);
      } catch (error) {
        console.error("Failed to create page from template:", error);
      }
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex h-screen flex-col bg-[#f5f1e8]">
          {/* Top Navigation Bar */}
          <TopNavbar />

          {/* Editor Toolbar */}
          <EditorToolbar />

          {/* Main Editor Layout - Fixed width sidebars like Figma/Canva */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Fixed 280px width */}
            <div
              className="relative flex-shrink-0 bg-white border-r border-[#8b7355]/20 transition-all duration-300 ease-in-out"
              style={{ width: leftSidebarOpen ? "280px" : "0px", overflow: "hidden" }}
            >
              <div className="h-full w-[280px]">
                <LeftSidebar />
              </div>
            </div>

            {/* Left sidebar toggle */}
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-md border border-l-0 border-[#8b7355]/20 bg-white p-1.5 shadow-sm hover:bg-[#faf8f3] transition-all"
              style={{ left: leftSidebarOpen ? "280px" : "0px" }}
              title={leftSidebarOpen ? "Masquer le panneau" : "Afficher le panneau"}
            >
              {leftSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4 text-[#8b7355]" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 text-[#8b7355]" />
              )}
            </button>

            {/* Center Canvas - Fills remaining space */}
            <div className="flex-1 min-w-0 bg-[#f5f1e8]">
              <Canvas />
            </div>

            {/* Right sidebar toggle */}
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-md border border-r-0 border-[#8b7355]/20 bg-white p-1.5 shadow-sm hover:bg-[#faf8f3] transition-all"
              style={{ right: rightSidebarOpen ? "300px" : "0px" }}
              title={rightSidebarOpen ? "Masquer les propriétés" : "Afficher les propriétés"}
            >
              {rightSidebarOpen ? (
                <PanelRightClose className="h-4 w-4 text-[#8b7355]" />
              ) : (
                <PanelRightOpen className="h-4 w-4 text-[#8b7355]" />
              )}
            </button>

            {/* Right Properties Panel - Fixed 300px width */}
            <div
              className="relative flex-shrink-0 bg-white border-l border-[#8b7355]/20 transition-all duration-300 ease-in-out"
              style={{ width: rightSidebarOpen ? "300px" : "0px", overflow: "hidden" }}
            >
              <div className="h-full w-[300px]">
                <PropertiesPanel />
              </div>
            </div>
          </div>
        </div>
      </DndContext>

      {/* Dialog Manager - Renders all dialogs */}
      <DialogManager />
    </>
  );
}
