import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Coins, Mic, ArrowRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const credits = parseInt(params.get("credits") ?? "0", 10);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  }, []);

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center gap-8" data-testid="checkout-success-page">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display" data-testid="checkout-success-title">Credits added!</h1>
          <p className="text-muted-foreground text-lg">Your purchase was successful.</p>
        </div>

        {credits > 0 && (
          <Card className="w-full border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Coins className="w-6 h-6 text-primary" />
                <span className="text-2xl font-bold font-display" data-testid="checkout-credits-added">+{credits} credits</span>
              </div>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-green-600" />
                  <p className="text-sm">1 credit = 1 Chinese character recorded</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm">Score 95%+ and your credits are refunded</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            onClick={() => navigate('/profile?tab=credits')}
            data-testid="checkout-success-profile-btn"
          >
            View Credits
          </Button>
        </div>
      </div>
    </Layout>
  );
}
