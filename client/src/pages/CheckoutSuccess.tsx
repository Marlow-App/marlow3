import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Mic, ArrowRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();

  const { data: subscriptionData, isLoading } = useQuery<any>({
    queryKey: ['/api/stripe/subscription'],
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/stripe/subscription'] });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  }, []);

  const sub = subscriptionData?.subscription;
  const tier = sub?.product_metadata?.tier || (typeof sub?.product_metadata === 'string' ? JSON.parse(sub.product_metadata)?.tier : null);
  const isMax = tier === 'max';
  const planName = isMax ? 'Pro Max' : 'Pro Starter';
  const dailyLimit = isMax ? 15 : 5;
  const price = isMax ? '$9.99' : '$4.99';

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center gap-8" data-testid="checkout-success-page">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display" data-testid="checkout-success-title">Thanks for signing up!</h1>
          <p className="text-muted-foreground text-lg">Your subscription is now active.</p>
        </div>

        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        ) : sub ? (
          <Card className="w-full border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-primary fill-primary" />
                <span className="text-xl font-bold font-display" data-testid="checkout-plan-name">{planName}</span>
                <span className="text-muted-foreground">— {price}/mo</span>
              </div>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-green-600" />
                  <p className="text-sm">Up to <strong>{dailyLimit} recordings</strong> per day</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm">{isMax ? 'Priority' : ''} 24-hour feedback guarantee</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground">Setting up your subscription...</p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/record')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
            data-testid="checkout-success-record-btn"
          >
            Start Recording
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            data-testid="checkout-success-profile-btn"
          >
            View Profile
          </Button>
        </div>
      </div>
    </Layout>
  );
}
