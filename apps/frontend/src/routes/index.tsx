import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import api from '@/lib/api'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setToken = useAuthStore((state) => state.setToken)

  const [accessForm, setAccessForm] = useState({ name: '', password: '' })
  const [createForm, setCreateForm] = useState({ name: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/editor' })
    }
  }, [isAuthenticated, navigate])

  const handleAccessProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await api.projects.access(accessForm.name, accessForm.password)

      setToken(response.token, response.project)

      toast({
        title: 'Access granted',
        description: `Welcome to ${response.project.name}`,
      })

      navigate({ to: '/editor' })
    } catch (error) {
      toast({
        title: 'Access denied',
        description: error instanceof Error ? error.message : 'Invalid project name or password',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await api.projects.create(createForm.name, createForm.password)

      setToken(response.token, response.project)

      toast({
        title: 'Project created',
        description: `${response.project.name} has been created successfully`,
      })

      navigate({ to: '/editor' })
    } catch (error) {
      toast({
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'Could not create project',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1e8] p-4">
      <Card className="w-full max-w-md border-2 border-[#8b7355] bg-white shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-serif text-3xl text-[#8b7355]">
            La Gazette de la Vie
          </CardTitle>
          <CardDescription className="text-[#6d5a43]">
            Access your gazette or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="access" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="access">Access Project</TabsTrigger>
              <TabsTrigger value="create">Create Project</TabsTrigger>
            </TabsList>

            <TabsContent value="access">
              <form onSubmit={handleAccessProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-name">Project Name</Label>
                  <Input
                    id="access-name"
                    placeholder="Enter project name"
                    value={accessForm.name}
                    onChange={(e) =>
                      setAccessForm({ ...accessForm, name: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-password">Password</Label>
                  <Input
                    id="access-password"
                    type="password"
                    placeholder="Enter password"
                    value={accessForm.password}
                    onChange={(e) =>
                      setAccessForm({ ...accessForm, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#8b7355] hover:bg-[#6d5a43]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Accessing...' : 'Access Project'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create">
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Project Name</Label>
                  <Input
                    id="create-name"
                    placeholder="Enter project name"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    placeholder="Create password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#8b7355] hover:bg-[#6d5a43]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
