import { ImageUploadDialog } from './ImageUploadDialog';
import { TemplateDialog } from './TemplateDialog';
import { ShareDialog } from './ShareDialog';
import { ExportDialog } from './ExportDialog';
import { GenerationProgressDialog } from './GenerationProgressDialog';
import { GenerationReviewDialog } from './GenerationReviewDialog';

// Re-export all dialogs for external use
export { ImageUploadDialog, TemplateDialog, ShareDialog, ExportDialog, GenerationProgressDialog, GenerationReviewDialog };

// Central dialog manager component that renders all dialogs
export function DialogManager() {
  return (
    <>
      <ImageUploadDialog />
      <TemplateDialog />
      <ShareDialog />
      <ExportDialog />
      <GenerationProgressDialog />
      <GenerationReviewDialog />
    </>
  );
}
