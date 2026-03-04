import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, Crown, Zap, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const CHINESE_LEVELS = [
  "Absolute Beginner",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Near Native"
];

const DIALECTS = [
  "Mandarin",
  "Wu (Shanghainese)",
  "Yue (Cantonese)",
  "Min",
  "Jin",
  "Xiang",
  "Hakka",
  "Gan",
  "Huizhou",
  "Pinghua"
];

// 1st and 2nd tier cities in China, sorted alphabetically
const CITIES = [
  "Beijing", "Changchun", "Changsha", "Changzhou", "Chengdu", "Chongqing", "Dalian", "Dongguan", "Foshan", "Fuzhou",
  "Guangzhou", "Guiyang", "Haikou", "Hangzhou", "Harbin", "Hefei", "Hohhot", "Huizhou", "Jiaxing", "Jinan",
  "Jinhua", "Kunming", "Lanzhou", "Lhasa", "Linyi", "Nanchang", "Nanjing", "Nanning", "Nantong", "Ningbo",
  "Qingdao", "Quanzhou", "Shaoxing", "Shanghai", "Shenyang", "Shenzhen", "Shijiazhuang", "Suzhou", "Taiyuan", "Taizhou",
  "Tangshan", "Tianjin", "Urumqi", "Weifang", "Wenzhou", "Wuhan", "Wuxi", "Xi'an", "Xiamen", "Xining",
  "Xuzhou", "Yantai", "Yinchuan", "Zhengzhou", "Zhongshan", "Zhuhai"
];

export default function Profile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    profileImageUrl: user?.profileImageUrl || "",
    chineseLevel: user?.chineseLevel || "",
    city: user?.city || "",
    teachingExperience: user?.teachingExperience || 0,
    dialects: user?.dialects || [] as string[]
  });

  const [cityOpen, setCityOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chineseLevelRef = useRef<HTMLDivElement>(null);
  const [highlightLevel, setHighlightLevel] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("highlight") === "chineseLevel") {
      setHighlightLevel(true);
      setIsEditing(true);
      setTimeout(() => {
        chineseLevelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      setTimeout(() => setHighlightLevel(false), 4000);
    }
  }, []);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: products } = useQuery<any[]>({
    queryKey: ['/api/stripe/products'],
  });

  const { data: subscriptionData } = useQuery<any>({
    queryKey: ['/api/stripe/subscription'],
  });

  const hasSubscription = !!subscriptionData?.subscription;

  const getProductPrice = (productName: string) => {
    const product = products?.find((p: any) => p.name === productName);
    return product?.prices?.[0];
  };

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

  const handleManageSubscription = () => {
    navigate('/manage-subscription');
  };

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImageUrl: user.profileImageUrl || "",
        chineseLevel: user.chineseLevel || "",
        city: user.city || "",
        teachingExperience: user.teachingExperience || 0,
        dialects: user.dialects || []
      });
    }
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadFile(file);
      if (res) {
        setFormData(prev => ({ ...prev, profileImageUrl: res.objectPath }));
        toast({ title: "Photo uploaded", description: "Save profile to keep changes." });
      }
    } catch (err) {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiRequest("PATCH", "/api/auth/user", formData);
      const updatedUser = await res.json();
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const isReviewer = user?.role === 'reviewer';

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-display">Your Profile</h1>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your public identity on SixTone Studio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-border/50">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-primary/10">
                    <AvatarImage src={formData.profileImageUrl} />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                      {formData.firstName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Label 
                      htmlFor="photo-upload" 
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium"
                    >
                      {isUploading ? "Uploading..." : "Change"}
                      <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                    </Label>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName} 
                      onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName} 
                      onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {!isReviewer ? (
                <div className="space-y-4 pt-4">
                  <div
                    ref={chineseLevelRef}
                    className={`space-y-2 rounded-lg p-3 -mx-3 transition-all duration-500 ${highlightLevel ? "bg-primary/10 ring-2 ring-primary/40 animate-pulse" : ""}`}
                  >
                    <Label className={highlightLevel ? "text-primary font-bold" : ""}>Chinese Level</Label>
                    <Select 
                      disabled={!isEditing} 
                      value={formData.chineseLevel} 
                      onValueChange={v => setFormData(p => ({ ...p, chineseLevel: v }))}
                    >
                      <SelectTrigger className={highlightLevel ? "border-primary ring-1 ring-primary/30" : ""}>
                        <SelectValue placeholder="Select your level" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHINESE_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Hometown City</Label>
                      <Popover open={cityOpen && isEditing} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={cityOpen}
                            className="w-full justify-between"
                            disabled={!isEditing}
                          >
                            {formData.city || "Select city..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search city..." />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup>
                                {CITIES.map((city) => (
                                  <CommandItem
                                    key={city}
                                    value={city}
                                    onSelect={(currentValue) => {
                                      setFormData(p => ({ ...p, city: currentValue }));
                                      setCityOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.city === city ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {city}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Teaching Experience (Years)</Label>
                      <Input 
                        id="experience" 
                        type="number" 
                        min="0"
                        value={formData.teachingExperience} 
                        onChange={e => setFormData(p => ({ ...p, teachingExperience: parseInt(e.target.value) || 0 }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Dialects Spoken</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border rounded-lg p-4 bg-muted/20">
                      {DIALECTS.map(dialect => (
                        <div key={dialect} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`dialect-${dialect}`} 
                            checked={formData.dialects.includes(dialect)}
                            disabled={!isEditing}
                            onCheckedChange={(checked) => {
                              setFormData(prev => {
                                const dialects = checked 
                                  ? [...prev.dialects, dialect]
                                  : prev.dialects.filter(d => d !== dialect);
                                return { ...prev, dialects };
                              });
                            }}
                          />
                          <Label htmlFor={`dialect-${dialect}`} className="text-sm font-normal cursor-pointer">
                            {dialect}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!isReviewer && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card
                className={`relative overflow-hidden hover:shadow-xl transition-shadow ${
                  !hasSubscription
                    ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 via-transparent to-transparent ring-2 ring-green-500/20'
                    : 'border-border bg-muted/10'
                }`}
                data-testid="free-plan-card"
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className={`w-5 h-5 ${!hasSubscription ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className={`${!hasSubscription ? 'text-green-600' : 'text-muted-foreground'} font-bold uppercase tracking-widest text-[10px]`}>
                      {!hasSubscription ? 'Current Plan' : 'Free Tier'}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-display">Free</CardTitle>
                  <CardDescription className="text-sm">Get started with basic practice.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 mt-1 ${!hasSubscription ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <p className="text-sm">1 recording / day</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 mt-1 ${!hasSubscription ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <p className="text-sm">Standard feedback</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`relative overflow-hidden hover:shadow-xl transition-shadow ${
                  hasSubscription
                    ? subscriptionData?.subscription?.cancel_at_period_end
                      ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent ring-2 ring-yellow-500/20'
                      : 'border-green-500/30 bg-gradient-to-br from-green-500/5 via-transparent to-transparent ring-2 ring-green-500/20'
                    : 'border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent'
                }`}
                data-testid="pro-plan-card"
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className={`w-5 h-5 ${
                      hasSubscription
                        ? subscriptionData?.subscription?.cancel_at_period_end
                          ? 'text-yellow-600 fill-yellow-600'
                          : 'text-green-600 fill-green-600'
                        : 'text-primary fill-primary'
                    }`} />
                    <span className={`${
                      hasSubscription
                        ? subscriptionData?.subscription?.cancel_at_period_end
                          ? 'text-yellow-600'
                          : 'text-green-600'
                        : 'text-primary'
                    } font-bold uppercase tracking-widest text-[10px]`}>
                      {hasSubscription
                        ? subscriptionData?.subscription?.cancel_at_period_end ? 'Cancelled' : 'Active'
                        : 'Upgrade'}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-display">Pro Plan</CardTitle>
                  <CardDescription className="text-sm">
                    {hasSubscription
                      ? subscriptionData?.subscription?.cancel_at_period_end
                        ? 'Cancelled — you still have access until the end of your billing period.'
                        : 'Your subscription is active.'
                      : 'For serious learners who want faster progress.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 mt-1 ${hasSubscription ? 'text-green-600' : 'text-green-600'}`} />
                    <p className="text-sm">3 recordings / day</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 mt-1 ${hasSubscription ? 'text-green-600' : 'text-green-600'}`} />
                    <p className="text-sm">Priority feedback</p>
                  </div>
                </CardContent>
                <CardFooter>
                  {hasSubscription ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      data-testid="profile-manage-subscription-btn"
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                      disabled={!!checkoutLoading}
                      onClick={() => {
                        const price = getProductPrice('Pro Plan') || getProductPrice('Pro Starter');
                        if (price) { handleCheckout(price.id); }
                        else { toast({ title: "Loading pricing", description: "Please wait a moment and try again.", variant: "destructive" }); }
                      }}
                      data-testid="profile-checkout-pro-btn"
                    >
                      {checkoutLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        'Upgrade $7.99/mo'
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
