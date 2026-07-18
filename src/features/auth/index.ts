export type {
  AppRole,
  AuthProfileUpdateInput,
  AuthUser,
  AuthUserRole,
  AuthenticatedSession,
  PersistedRole,
  ResetPasswordInput,
  SignInCredentials,
  SignUpCredentials,
  UserStatus,
} from "./types";
export {
  AuthError,
  AuthService,
  CUSTOMERS_COLLECTION,
  IdentityBootstrapService,
  RoleResolver,
} from "./services";
export {
  buildLoginHref,
  buildSignupHref,
  mapAuthUser,
  sanitizeRedirectTo,
} from "./lib";
export { AuthProvider, useAuth } from "./providers";
export {
  useCurrentUser,
  useRequireAuth,
  useRequireGuest,
  useRequireRole,
} from "./hooks";
export { RequireAuth, RequireGuest, RequireRole } from "./guards";
export {
  AdminLoginForm,
  ForgotPasswordForm,
  GoogleAuthButton,
  LoginForm,
  SignupForm,
} from "./components";

