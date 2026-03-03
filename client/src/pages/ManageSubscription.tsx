import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";

export default function ManageSubscription() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: subscriptionData, isLoading: subLoading } = useQuery<any>({
    queryKey: ['/api/stripe/subscription'],
  });

  const { data: products, isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ['/api/stripe/products'],
  });

  const sub = subscriptionData?.subscription;
  const subPrice = sub?.items?.data?.[0]?.price;
  const subProductObj = subPrice?.product;
  const currentProductId = typeof subProductObj === 'string' ? subProductObj : subProductObj?.id;
  const cancelAtPeriodEnd = sub?.cancel_at_period_end;

  const currentProduct = products?.find((p: any) => p.id === currentProductId);
  const currentTier = currentProduct?.metadata?.tier || subProductObj?.metadata?.tier;
  const currentName = currentProduct?.name || subProductObj?.name || sub?.product_name || 'Pro Plan';
  const currentPrice = subPrice?.unit_amount || currentProduct?.prices?.[0]?.unit_amount;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiRequest("POST", "/api/stripe/cancel", {});
      await queryClient.invalidateQueries({ queryKey: ['/api/stripe/subscription'] });
      setShowCancelConfirm(false);
      toast({ title: "Subscription cancelled", description: "You'll keep access until the end of your billing period." });
    } catch (err) {
      toast({ title: "Failed to cancel", description: "Please try again.", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await apiRequest("POST", "/api/stripe/reactivate", {});
      await queryClient.invalidateQueries({ queryKey: ['/api/stripe/subscription'] });
      toast({ title: "Subscription reactivated!", description: "Your plan will continue as normal." });
    } catch (err) {
      toast({ title: "Failed to reactivate", description: "Please try again.", variant: "destructive" });
    } finally {
      setReactivating(false);
    }
  };

  const formatPrice = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  if (subLoading || productsLoading) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!sub) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-muted-foreground">No active subscription found.</p>
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" data-testid="manage-subscription-page">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} data-testid="manage-sub-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold font-display">Manage Subscription</h1>
        </div>

        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-transparent to-transparent" data-testid="current-plan-card">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-green-600 fill-green-600" />
              <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">
                {cancelAtPeriodEnd ? 'Cancelled' : 'Current Plan'}
              </span>
            </div>
            <CardTitle className="text-xl font-display" data-testid="current-plan-name">{currentName}</CardTitle>
            <CardDescription className="text-sm">
              $7.99/month
              {cancelAtPeriodEnd && ' — Access until end of billing period'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm">3 recordings per day</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm">Priority feedback</p>
            </div>
          </CardContent>
          {cancelAtPeriodEnd && (
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleReactivate}
                disabled={reactivating}
                data-testid="reactivate-btn"
              >
                {reactivating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reactivating...</> : 'Reactivate Subscription'}
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card className="border-border bg-muted/10" data-testid="free-plan-info-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">If cancelled, you'll revert to:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">1 recording per day</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Standard feedback</p>
            </div>
          </CardContent>
        </Card>

        {!cancelAtPeriodEnd && (
          <div className="pt-4 border-t border-border/50">
            {!showCancelConfirm ? (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setShowCancelConfirm(true)}
                data-testid="cancel-sub-btn"
              >
                Cancel Subscription
              </Button>
            ) : (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Are you sure you want to cancel?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You'll keep access to your current plan until the end of your billing period. After that, you'll go back to the free plan (1 recording per day).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={cancelling}
                      data-testid="confirm-cancel-btn"
                    >
                      {cancelling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling...</> : 'Yes, Cancel'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelConfirm(false)}
                      data-testid="keep-sub-btn"
                    >
                      Keep Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
