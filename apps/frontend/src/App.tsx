import { useState } from "react";
import { Newspaper, Sparkles, Camera, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function App() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12 animate-page-appear">
        {/* Masthead */}
        <header className="text-center space-y-2">
          <h1 className="masthead">La Gazette de la Vie</h1>
          <p className="subheading">Where Memories Come to Life</p>
          <hr className="divider-double" />
        </header>

        {/* Color Palette Demo */}
        <section className="space-y-4">
          <h2 className="headline">Color Palette</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-parchment border border-border" />
              <p className="caption text-center">Parchment</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-sepia" />
              <p className="caption text-center">Sepia</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-gold" />
              <p className="caption text-center">Gold</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-ink" />
              <p className="caption text-center">Ink</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-muted border border-border" />
              <p className="caption text-center">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-cream border border-border" />
              <p className="caption text-center">Cream</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-aged-red" />
              <p className="caption text-center">Aged Red</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-sm bg-forest-green" />
              <p className="caption text-center">Forest Green</p>
            </div>
          </div>
          <hr className="divider-vintage" />
        </section>

        {/* Typography Demo */}
        <section className="space-y-4">
          <h2 className="headline">Typography System</h2>
          <div className="space-y-4 p-6 gazette-page paper-texture rounded-sm">
            <h3 className="masthead">Masthead Text</h3>
            <h4 className="headline ink-bleed">Headline with Ink Bleed</h4>
            <p className="subheading">Subheading in Libre Baskerville Italic</p>
            <p className="body-text">
              Body text in EB Garamond. Bienvenue a La Gazette de la Vie. Here, your cherished
              photographs transform into living memories, ready to tell their stories once more.
            </p>
            <p className="caption">Caption text for dates and secondary info</p>
            <p className="ui-text">UI text in Inter for interface elements</p>
          </div>
          <hr className="divider-vintage" />
        </section>

        {/* Button Variants */}
        <section className="space-y-4">
          <h2 className="headline">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button>
              <Sparkles className="h-4 w-4" />
              Generate Gazette
            </Button>
            <Button variant="outline">
              <Camera className="h-4 w-4" />
              Add Photo
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button variant="link">Link Style</Button>
          </div>
          <div className="flex gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="ghost" aria-label="Add item">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <hr className="divider-vintage" />
        </section>

        {/* Form Elements */}
        <section className="space-y-4">
          <h2 className="headline">Form Elements</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input id="project-name" placeholder="Famille Dupont 1950-2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="vous@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="This page awaits your memories. Click to add a photograph and bring the past to life."
              rows={4}
            />
          </div>
          <hr className="divider-vintage" />
        </section>

        {/* Card Components */}
        <section className="space-y-4">
          <h2 className="headline">Card Components</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Animation Suggestions</CardTitle>
                <CardDescription>AI-powered animation ideas for your photos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="body-text">
                  Your memories have awakened. Select an animation style to bring this photograph to
                  life.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Sparkles className="h-4 w-4" />
                  Generate Ideas
                </Button>
              </CardFooter>
            </Card>

            <Card className="vintage-shadow">
              <CardHeader>
                <CardTitle>Gazette Preview</CardTitle>
                <CardDescription>Vintage shadow style card</CardDescription>
              </CardHeader>
              <CardContent className="gazette-page paper-texture rounded-sm p-4 min-h-[100px]">
                <p className="caption text-center">Your gazette preview here</p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>
          </div>
          <hr className="divider-vintage" />
        </section>

        {/* Dialog Demo */}
        <section className="space-y-4">
          <h2 className="headline">Dialog Component</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Newspaper className="h-4 w-4" />
                Open Dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Photograph</DialogTitle>
                <DialogDescription>
                  Upload a cherished memory to bring it to life in your gazette.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="photo-title">Photo Title</Label>
                  <Input id="photo-title" placeholder="Summer of 1952" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo-caption">Caption</Label>
                  <Textarea id="photo-caption" placeholder="Describe the memory..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDialogOpen(false)}>
                  <Camera className="h-4 w-4" />
                  Add Photo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <hr className="divider-vintage" />
        </section>

        {/* Vintage Effects Demo */}
        <section className="space-y-4">
          <h2 className="headline">Vintage Effects</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="gazette-page paper-texture p-6 rounded-sm min-h-[200px] ornament-corners">
              <h3 className="headline text-center mb-4">Gazette Page</h3>
              <p className="body-text">
                This card demonstrates the gazette page effect with vignette, paper texture overlay,
                fold line, and ornamental corners.
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded-sm vintage-shadow">
                <p className="ui-text">Vintage shadow effect</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-sm">
                <p className="headline ink-bleed">Ink Bleed Effect</p>
              </div>
              <div className="p-4 bg-parchment border border-border rounded-sm sepia-vintage">
                <p className="body-text">Sepia vintage filter</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8">
          <hr className="divider-double" />
          <p className="caption">La Gazette de la Vie - Component Theme Test</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
