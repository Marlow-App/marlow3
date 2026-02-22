import { Layout } from "@/components/Layout";
import { useRecordings } from "@/hooks/use-recordings";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic2, MessageCircle, Clock, CheckCircle2, ChevronRight, Crown, Zap, Shield, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function LearnerPortal() {
  const { data: recordings, isLoading } = useRecordings() as { data: any[], isLoading: boolean };
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const searchString = useSearch();

  const { data: products } = useQuery<any[]>({
    queryKey: ['/api/stripe/products'],
  });

  const { data: subscriptionData } = useQuery<any>({
    queryKey: ['/api/stripe/subscription'],
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('checkout') === 'success') {
      toast({ title: "Subscription activated!", description: "Welcome to your new plan." });
    } else if (params.get('checkout') === 'cancel') {
      toast({ title: "Checkout cancelled", description: "No charges were made.", variant: "destructive" });
    }
  }, [searchString]);

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Error", description: "Unable to open billing portal.", variant: "destructive" });
    }
  };

  const hasSubscription = !!subscriptionData?.subscription;

  const getProductPrice = (productName: string) => {
    const product = products?.find((p: any) => p.name === productName);
    return product?.prices?.[0];
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Learner Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your progress and feedback</p>
          </div>
          <Link href="/record">
            <Button className="rounded-full shadow-lg shadow-primary/20">
              <Mic2 className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {recordings?.map((recording) => (
            <Card key={recording.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{recording.sentenceText}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={recording.status === "reviewed" ? "default" : "secondary"}
                    className="rounded-full px-3"
                  >
                    {recording.status === "reviewed" ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Reviewed</span>
                    ) : (
                      "Pending"
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                      <audio 
                        key={recording.audioUrl}
                        src={recording.audioUrl} 
                        controls 
                        className="w-full h-10"
                        preload="metadata"
                      />
                    </div>
                    {recording.status === "reviewed" && recording.feedback?.[0] ? (
                  <div className="space-y-4">
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-primary">Native Speaker Feedback</p>
                          <p className="text-sm text-foreground/80 mt-1 italic">
                            "{recording.feedback[0].textFeedback}"
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link href={`/recordings/${recording.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Full Details <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground italic">
                      Waiting for a native speaker to review your recording...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {hasSubscription ? (
          <div className="mt-8">
            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-transparent to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-green-600 fill-green-600" />
                  <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">Active</span>
                </div>
                <CardTitle className="text-xl font-display">
                  {subscriptionData?.subscription?.product_name || 'Pro Plan'}
                </CardTitle>
                <CardDescription className="text-sm">Your subscription is active.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManageSubscription}
                  data-testid="manage-subscription-btn"
                >
                  Manage Subscription
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 mt-8">
            <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 via-transparent to-transparent relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                   <Crown className="w-5 h-5 text-secondary fill-secondary" />
                   <span className="text-secondary font-bold uppercase tracking-widest text-[10px]">Starter</span>
                </div>
                <CardTitle className="text-xl font-display">Pro Starter</CardTitle>
                <CardDescription className="text-sm">Perfect for consistent daily practice.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">Up to 5 recordings / day</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">24h feedback guarantee</p>
                </div>
              </CardContent>
              <CardFooter>
                 <Button
                   className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold shadow-sm"
                   disabled={!!checkoutLoading}
                   onClick={() => {
                     const price = getProductPrice('Pro Starter');
                     if (price) handleCheckout(price.id);
                   }}
                   data-testid="checkout-starter-btn"
                 >
                   {checkoutLoading === getProductPrice('Pro Starter')?.id ? (
                     <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                   ) : (
                     'Upgrade $4.99/mo'
                   )}
                 </Button>
              </CardFooter>
            </Card>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent relative overflow-hidden ring-2 ring-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                   <Crown className="w-5 h-5 text-primary fill-primary" />
                   <span className="text-primary font-bold uppercase tracking-widest text-[10px]">Advanced</span>
                </div>
                <CardTitle className="text-xl font-display">Pro Max</CardTitle>
                <CardDescription className="text-sm">For serious learners seeking immersion.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">Up to 15 recordings / day</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">Priority 24h feedback</p>
                </div>
              </CardContent>
              <CardFooter>
                 <Button
                   className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                   disabled={!!checkoutLoading}
                   onClick={() => {
                     const price = getProductPrice('Pro Max');
                     if (price) handleCheckout(price.id);
                   }}
                   data-testid="checkout-max-btn"
                 >
                   {checkoutLoading === getProductPrice('Pro Max')?.id ? (
                     <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                   ) : (
                     'Upgrade $9.99/mo'
                   )}
                 </Button>
              </CardFooter>
            </Card>
          </div>
        )}

          {(!recordings || recordings.length === 0) && (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border mt-8">
              <Mic2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium">No recordings yet</h3>
              <p className="text-muted-foreground mt-2 mb-6">Start your journey by recording your first sentence!</p>
              <Link href="/record">
                <Button>Record Now</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
