import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Shield } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in">
        <h1 className="text-3xl font-bold font-display">Your Profile</h1>

        {/* User Info Card */}
        <Card>
          <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/10">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {user?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex justify-center md:justify-start gap-2 mt-3">
                <Badge variant="outline" className="rounded-full">Free Plan</Badge>
                <Badge variant="secondary" className="rounded-full bg-amber-100 text-amber-800">New Learner</Badge>
              </div>
            </div>
            
            <Button variant="outline" onClick={() => logout()}>Log Out</Button>
          </CardContent>
        </Card>

        {/* Premium Upgrade Card */}
        <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 via-transparent to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Crown className="w-48 h-48 rotate-12 text-secondary" />
          </div>
          
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
               <Crown className="w-6 h-6 text-secondary fill-secondary" />
               <span className="text-secondary font-bold uppercase tracking-widest text-xs">Premium</span>
            </div>
            <CardTitle className="text-2xl font-display">Upgrade to TonePerfect Pro</CardTitle>
            <CardDescription className="text-base">Accelerate your learning with faster feedback and more practice.</CardDescription>
          </CardHeader>
          
          <CardContent className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-background shadow-sm text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Priority Feedback</h4>
                <p className="text-sm text-muted-foreground">Get reviews within 24 hours guaranteed.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-background shadow-sm text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Unlimited Recordings</h4>
                <p className="text-sm text-muted-foreground">Practice as much as you want every day.</p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4">
             <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold shadow-lg shadow-secondary/20 h-12">
               Upgrade for $5/month
             </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
