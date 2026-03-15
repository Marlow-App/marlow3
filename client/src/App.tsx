import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import RecordPage from "@/pages/Record";
import ReviewerPortal from "@/pages/ReviewerPortal";
import LearnerPortal from "@/pages/LearnerPortal";
import RecordingDetail from "@/pages/RecordingDetail";
import Profile from "@/pages/Profile";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import ManageSubscription from "@/pages/ManageSubscription";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ConsentGate from "@/pages/ConsentGate";
import NotFound from "@/pages/not-found";

const PUBLIC_PATHS = ["/privacy-policy", "/terms"];

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  const isPublicPage = PUBLIC_PATHS.includes(location);

  if (isLoading && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !isPublicPage) {
    return <Landing />;
  }

  if (user && !user.consentGiven && !isPublicPage) {
    return <ConsentGate />;
  }

  return (
    <Switch>
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/">
        <Home />
      </Route>
      <Route path="/record" component={RecordPage} />
      <Route path="/learner-portal" component={LearnerPortal} />
      <Route path="/reviewer-hub" component={ReviewerPortal} />
      <Route path="/recordings/:id">
        {(params: { id: string }) => <RecordingDetail key={params.id} />}
      </Route>
      <Route path="/profile" component={Profile} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/manage-subscription" component={ManageSubscription} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
