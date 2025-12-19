import { type FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
const minimumStrongLength = VALIDATION.PASSWORD_MIN + 4;

const getPasswordStrength = (password: string) => {
  if (!password) {
    return null;
  }

  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const meetsMin = password.length >= VALIDATION.PASSWORD_MIN;
  const longEnough = password.length >= minimumStrongLength;

  if (!meetsMin) {
    return {
      label: "Weak",
      score: 1,
      barClass: "bg-aged-red/70",
      textClass: "text-aged-red",
    };
  }

  const score = Number(longEnough) + Number(hasNumber || hasSymbol) + Number(hasMixedCase);
  if (score >= 2) {
    return {
      label: "Strong",
      score: 3,
      barClass: "bg-emerald-500/70",
      textClass: "text-emerald-700",
    };
  }

  return {
    label: "Medium",
    score: 2,
    barClass: "bg-gold/70",
    textClass: "text-gold",
  };
};

function AuthPage() {
  const navigate = useNavigate();
  const [createValues, setCreateValues] = useState({ name: "", password: "" });
  const [createErrors, setCreateErrors] = useState<FieldErrors>({});
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createPasswordVisible, setCreatePasswordVisible] = useState(false);

  const [loginValues, setLoginValues] = useState({ name: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<FieldErrors>({});
  const [loginFormError, setLoginFormError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);

  const createPasswordStrength = getPasswordStrength(createValues.password);

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

      toast({
        title: "Project created",
        description: `Welcome to ${response.name}.`,
        variant: "success",
      });
      navigate({ to: "/editor" });
    } catch (error) {
      const parsed = await parseApiError(error);
      setCreateFormError(parsed.message);
      toast({
        title: "Create project failed",
        description: parsed.message,
        variant: "destructive",
      });
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

      toast({
        title: "Signed in",
        description: `Welcome back to ${response.name}.`,
        variant: "success",
      });
      navigate({ to: "/editor" });
    } catch (error) {
      const parsed = await parseApiError(error);
      setLoginFormError(parsed.message);
      toast({
        title: "Sign in failed",
        description: parsed.message,
        variant: "destructive",
      });
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
        <h1 className="mb-4 font-headline text-ink-effect">La Gazette de la Vie</h1>
        <p className="font-subheading mb-8 text-lg text-muted italic">
          Where Memories Come to Life
        </p>
        <p className="mt-3 text-muted">
          Create a new project or return to continue crafting your animated family archive.
        </p>
      </div>

      <hr className="divider-vintage" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="gazette-page paper-texture ornament-corners vintage-shadow border-sepia/30">
          <CardHeader>
            <CardTitle>Create a Project</CardTitle>
            <CardDescription>Start a new gazette with a shared project password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className={cn(
                "space-y-4 transition-opacity",
                createSubmitting && "pointer-events-none opacity-75"
              )}
              onSubmit={handleCreateSubmit}
              aria-busy={createSubmitting}
            >
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
                  disabled={createSubmitting}
                  onChange={(event) => {
                    setCreateValues((prev) => ({ ...prev, name: event.target.value }));
                    if (createErrors.name) {
                      setCreateErrors((prev) => ({ ...prev, name: undefined }));
                    }
                    if (createFormError) {
                      setCreateFormError(null);
                    }
                  }}
                  className="input-vintage focus-visible:border-gold focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment/70"
                />
                {createErrors.name ? (
                  <p className="font-ui text-xs text-aged-red">{createErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password" className="font-ui text-sm text-muted">
                  Project password
                </Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    name="password"
                    type={createPasswordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Choose a password"
                    value={createValues.password}
                    disabled={createSubmitting}
                    onChange={(event) => {
                      setCreateValues((prev) => ({ ...prev, password: event.target.value }));
                      if (createErrors.password) {
                        setCreateErrors((prev) => ({ ...prev, password: undefined }));
                      }
                      if (createFormError) {
                        setCreateFormError(null);
                      }
                    }}
                    className="input-vintage pr-10 focus-visible:border-gold focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment/70"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={createSubmitting}
                    className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted hover:text-ink"
                    onClick={() => setCreatePasswordVisible((prev) => !prev)}
                    aria-label={createPasswordVisible ? "Hide password" : "Show password"}
                    aria-pressed={createPasswordVisible}
                  >
                    {createPasswordVisible ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <p className="font-ui text-xs text-muted">{passwordHint}</p>
                {createValues.password ? (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 3 }).map((_, index) => {
                        return (
                          <span
                            key={`strength-${index}`}
                            className={cn(
                              "h-1.5 flex-1 rounded-full bg-sepia/20",
                              createPasswordStrength &&
                                index < createPasswordStrength.score &&
                                createPasswordStrength.barClass
                            )}
                          />
                        );
                      })}
                    </div>
                    {createPasswordStrength ? (
                      <p className={cn("font-ui text-xs", createPasswordStrength.textClass)}>
                        {createPasswordStrength.label} password
                      </p>
                    ) : null}
                  </div>
                ) : null}
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
                {createSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create project"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-xs text-muted">
            You can invite collaborators by sharing the project name and password.
          </CardFooter>
        </Card>

        <Card className="gazette-page paper-texture ornament-corners vintage-shadow border-sepia/30">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Return to a project you have already created.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className={cn(
                "space-y-4 transition-opacity",
                loginSubmitting && "pointer-events-none opacity-75"
              )}
              onSubmit={handleLoginSubmit}
              aria-busy={loginSubmitting}
            >
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
                  disabled={loginSubmitting}
                  onChange={(event) => {
                    setLoginValues((prev) => ({ ...prev, name: event.target.value }));
                    if (loginErrors.name) {
                      setLoginErrors((prev) => ({ ...prev, name: undefined }));
                    }
                    if (loginFormError) {
                      setLoginFormError(null);
                    }
                  }}
                  className="input-vintage focus-visible:border-gold focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment/70"
                />
                {loginErrors.name ? (
                  <p className="font-ui text-xs text-aged-red">{loginErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="font-ui text-sm text-muted">
                  Project password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={loginPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginValues.password}
                    disabled={loginSubmitting}
                    onChange={(event) => {
                      setLoginValues((prev) => ({ ...prev, password: event.target.value }));
                      if (loginErrors.password) {
                        setLoginErrors((prev) => ({ ...prev, password: undefined }));
                      }
                      if (loginFormError) {
                        setLoginFormError(null);
                      }
                    }}
                    className="input-vintage pr-10 focus-visible:border-gold focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment/70"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={loginSubmitting}
                    className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted hover:text-ink"
                    onClick={() => setLoginPasswordVisible((prev) => !prev)}
                    aria-label={loginPasswordVisible ? "Hide password" : "Show password"}
                    aria-pressed={loginPasswordVisible}
                  >
                    {loginPasswordVisible ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
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
                {loginSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
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
