import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { toast } from "sonner";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

let hasShownAuthToast = false;
let redirectTimeout: NodeJS.Timeout | null = null;

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG ||
                        error.data?.code === 'UNAUTHORIZED' ||
                        error.shape?.data?.code === 'UNAUTHORIZED';

  if (!isUnauthorized) return;

  // Evitar múltiplos toasts e redirecionamentos
  if (!hasShownAuthToast) {
    hasShownAuthToast = true;
    
    toast.error('Sessão expirada', {
      description: 'Você será redirecionado para o login em 3 segundos...',
      duration: 3000,
    });

    // Limpar timeout anterior se existir
    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
    }

    // Salvar URL atual para retornar após login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }

    // Redirecionar após 3 segundos
    redirectTimeout = setTimeout(() => {
      window.location.href = getLoginUrl();
    }, 3000);
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
