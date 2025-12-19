import { type FormEvent, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreateProjectSchema } from "@gazette/shared/schemas/project";
import { VALIDATION } from "@gazette/shared/constants";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, parseApiError } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type AuthResponse = {
  id: string;
  name: string;
  slug: string;
  token: string;
  createdAt: string;
  updatedAt?: string;
};

type FieldErrors = Partial<Record<"name" | "password", string>>;

const passwordHint = `Password must be ${VALIDATION.PASSWORD_MIN}-${VALIDATION.PASSWORD_MAX} characters.`;

function AuthPage() {
  const navigate = useNavigate();
  const [createValues, setCreateValues] = useState({ name: "", password: "" });
  const [createErrors, setCreateErrors] = useState<FieldErrors>({});
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [loginValues, setLoginValues] = useState({ name: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<FieldErrors>({});
  const [loginFormError, setLoginFormError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateFormError(null);

    const normalizedCreate = { ...createValues, name: createValues.name.trim() };
    const result = CreateProjectSchema.safeParse(normalizedCreate);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setCreateErrors({
        name: fieldErrors.name?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setCreateErrors({});
    setCreateSubmitting(true);

    try {
      const response = await api
        .post("projects", {
          json: result.data,
        })
        .json<AuthResponse>();

      setAuthSession({
        token: response.token,
        projectId: response.id,
        projectName: response.name,
        projectSlug: response.slug,
      });

      navigate({ to: "/editor" });
    } catch (error) {
      const parsed = await parseApiError(error);
      setCreateFormError(parsed.message);
      if (parsed.fieldErrors) {
        setCreateErrors({
          name: parsed.fieldErrors.name,
          password: parsed.fieldErrors.password,
        });
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginFormError(null);

    const normalizedLogin = { ...loginValues, name: loginValues.name.trim() };
    const result = CreateProjectSchema.safeParse(normalizedLogin);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setLoginErrors({
        name: fieldErrors.name?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setLoginErrors({});
    setLoginSubmitting(true);

    try {
      const response = await api
        .post("projects/access", {
          json: result.data,
        })
        .json<AuthResponse>();

      setAuthSession({
        token: response.token,
        projectId: response.id,
        projectName: response.name,
        projectSlug: response.slug,
      });

      navigate({ to: "/editor" });
    } catch (error) {
      const parsed = await parseApiError(error);
      setLoginFormError(parsed.message);
      if (parsed.fieldErrors) {
        setLoginErrors({
          name: parsed.fieldErrors.name,
          password: parsed.fieldErrors.password,
        });
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-headline text-ink-effect">Access Your Gazette</h2>
        <p className="mt-3 text-muted">
          Create a new project or return to continue crafting your animated family archive.
        </p>
      </div>

      <hr className="divider-vintage" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="gazette-page paper-texture ornament-corners border-sepia/30">
          <CardHeader>
            <CardTitle>Create a Project</CardTitle>
            <CardDescription>Start a new gazette with a shared project password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateSubmit}>
              {createFormError ? (
                <div className="rounded-sm border border-aged-red/30 bg-aged-red/10 px-3 py-2 font-ui text-sm text-aged-red">
                  {createFormError}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="create-name" className="font-ui text-sm text-muted">
                  Project name
                </Label>
                <Input
                  id="create-name"
                  name="name"
                  autoComplete="off"
                  placeholder="e.g. Famille Dupont 1950-2024"
                  value={createValues.name}
                  onChange={(event) => {
                    setCreateValues((prev) => ({ ...prev, name: event.target.value }));
                    if (createErrors.name) {
                      setCreateErrors((prev) => ({ ...prev, name: undefined }));
                    }
                    if (createFormError) {
                      setCreateFormError(null);
                    }
                  }}
                  className="input-vintage"
                />
                {createErrors.name ? (
                  <p className="font-ui text-xs text-aged-red">{createErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password" className="font-ui text-sm text-muted">
                  Project password
                </Label>
                <Input
                  id="create-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Choose a password"
                  value={createValues.password}
                  onChange={(event) => {
                    setCreateValues((prev) => ({ ...prev, password: event.target.value }));
                    if (createErrors.password) {
                      setCreateErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    if (createFormError) {
                      setCreateFormError(null);
                    }
                  }}
                  className="input-vintage"
                />
                <p className="font-ui text-xs text-muted">{passwordHint}</p>
                {createErrors.password ? (
                  <p className="font-ui text-xs text-aged-red">{createErrors.password}</p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createSubmitting}
                aria-busy={createSubmitting}
              >
                {createSubmitting ? "Creating..." : "Create project"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-xs text-muted">
            You can invite collaborators by sharing the project name and password.
          </CardFooter>
        </Card>

        <Card className="gazette-page paper-texture ornament-corners border-sepia/30">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Return to a project you have already created.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              {loginFormError ? (
                <div className="rounded-sm border border-aged-red/30 bg-aged-red/10 px-3 py-2 font-ui text-sm text-aged-red">
                  {loginFormError}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="login-name" className="font-ui text-sm text-muted">
                  Project name
                </Label>
                <Input
                  id="login-name"
                  name="name"
                  autoComplete="off"
                  placeholder="Enter your project name"
                  value={loginValues.name}
                  onChange={(event) => {
                    setLoginValues((prev) => ({ ...prev, name: event.target.value }));
                    if (loginErrors.name) {
                      setLoginErrors((prev) => ({ ...prev, name: undefined }));
                    }
                    if (loginFormError) {
                      setLoginFormError(null);
                    }
                  }}
                  className="input-vintage"
                />
                {loginErrors.name ? (
                  <p className="font-ui text-xs text-aged-red">{loginErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="font-ui text-sm text-muted">
                  Project password
                </Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginValues.password}
                  onChange={(event) => {
                    setLoginValues((prev) => ({ ...prev, password: event.target.value }));
                    if (loginErrors.password) {
                      setLoginErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    if (loginFormError) {
                      setLoginFormError(null);
                    }
                  }}
                  className="input-vintage"
                />
                {loginErrors.password ? (
                  <p className="font-ui text-xs text-aged-red">{loginErrors.password}</p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginSubmitting}
                aria-busy={loginSubmitting}
              >
                {loginSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-xs text-muted">
            Use the same password you set during project creation.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
