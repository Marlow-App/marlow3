import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <Switch>
      <Route path="/">
        {user.role === "reviewer" ? <ReviewerPortal /> : <Home />}
      </Route>
      <Route path="/record" component={RecordPage} />
      <Route path="/learner-portal" component={LearnerPortal} />
      <Route path="/reviewer-hub" component={ReviewerPortal} />
      <Route path="/recordings/:id" component={RecordingDetail} />
      <Route path="/profile" component={Profile} />
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
