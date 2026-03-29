import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Check, ChevronsUpDown, Loader2, Shield, CircleDollarSign, TrendingUp, RotateCcw, ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { NATIVE_LANGUAGES, FOCUS_AREA_OPTIONS } from "@/pages/Onboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useDisplayPrefs } from "@/hooks/use-display-prefs";
import { CREDIT_PACKS, REFUND_THRESHOLD, SIGNUP_BONUS, DAILY_REWARD } from "@shared/credits";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const CHINESE_LEVELS = [
  "Absolute Beginner",
  "Beginner",
  "Intermediate",
  "Advanced"
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

const CITIES = [
  "Beijing", "Changchun", "Changsha", "Changzhou", "Chengdu", "Chongqing", "Dalian", "Dongguan", "Foshan", "Fuzhou",
  "Guangzhou", "Guiyang", "Haikou", "Hangzhou", "Harbin", "Hefei", "Hohhot", "Huizhou", "Jiaxing", "Jinan",
  "Jinhua", "Kunming", "Lanzhou", "Lhasa", "Linyi", "Nanchang", "Nanjing", "Nanning", "Nantong", "Ningbo",
  "Qingdao", "Quanzhou", "Shaoxing", "Shanghai", "Shenyang", "Shenzhen", "Shijiazhuang", "Suzhou", "Taiyuan", "Taizhou",
  "Tangshan", "Tianjin", "Urumqi", "Weifang", "Wenzhou", "Wuhan", "Wuxi", "Xi'an", "Xiamen", "Xining",
  "Xuzhou", "Yantai", "Yinchuan", "Zhengzhou", "Zhongshan", "Zhuhai"
];

function sortedJson(arr: string[]) {
  return JSON.stringify([...arr].sort());
}

function txTypeLabel(type: string): { label: string; color: string; icon: typeof CircleDollarSign } {
  switch (type) {
    case "signup_bonus":  return { label: "Signup bonus",   color: "text-emerald-600", icon: Star };
    case "daily_reward":  return { label: "Daily reward",   color: "text-blue-600",    icon: TrendingUp };
    case "purchase":      return { label: "Purchase",       color: "text-primary",     icon: ShoppingCart };
    case "spend":         return { label: "Recording",      color: "text-amber-600",   icon: CircleDollarSign };
    case "refund":        return { label: "Refund",         color: "text-emerald-600", icon: RotateCcw };
    default:              return { label: type,             color: "text-foreground",  icon: CircleDollarSign };
  }
}

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload();
  const { showPinyin, showSandhi, setShowPinyin, setShowSandhi } = useDisplayPrefs();

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    profileImageUrl: user?.profileImageUrl || "",
    chineseLevel: user?.chineseLevel || "",
    nativeLanguage: user?.nativeLanguage || "",
    focusAreas: user?.focusAreas || [] as string[],
    city: user?.city || "",
    teachingExperience: user?.teachingExperience || 0,
    dialects: user?.dialects || [] as string[]
  });

  const [cityOpen, setCityOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [emailNotifications, setEmailNotifications] = useState<boolean>((user as any)?.emailNotifications ?? false);
  const chineseLevelRef = useRef<HTMLDivElement>(null);
  const [highlightLevel, setHighlightLevel] = useState(false);

  const { data: creditData } = useQuery<{ creditBalance: number; freeCreditsBalance: number; isUnlimited: boolean }>({
    queryKey: ['/api/credits/balance'],
  });

  const { data: transactions } = useQuery<any[]>({
    queryKey: ['/api/credits/transactions'],
    enabled: activeTab === "credits",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "settings" || tab === "credits") {
      setActiveTab(tab);
    } else if (params.get("highlight") === "chineseLevel") {
      setActiveTab("profile");
      setHighlightLevel(true);
      setTimeout(() => {
        chineseLevelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      setTimeout(() => setHighlightLevel(false), 4000);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImageUrl: user.profileImageUrl || "",
        chineseLevel: user.chineseLevel || "",
        nativeLanguage: user.nativeLanguage || "",
        focusAreas: user.focusAreas || [],
        city: user.city || "",
        teachingExperience: user.teachingExperience || 0,
        dialects: user.dialects || []
      });
      setEmailNotifications((user as any).emailNotifications ?? false);
    }
  }, [user]);

  async function handleEmailNotificationsChange(enabled: boolean) {
    setEmailNotifications(enabled);
    try {
      await apiRequest("PATCH", "/api/auth/user", { emailNotifications: enabled });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch {
      setEmailNotifications(!enabled);
      toast({ title: "Failed to update email notification setting", variant: "destructive" });
    }
  }

  const isDirty = user ? (
    formData.firstName !== (user.firstName || "") ||
    formData.lastName !== (user.lastName || "") ||
    formData.profileImageUrl !== (user.profileImageUrl || "") ||
    formData.chineseLevel !== (user.chineseLevel || "") ||
    formData.nativeLanguage !== (user.nativeLanguage || "") ||
    formData.city !== (user.city || "") ||
    formData.teachingExperience !== (user.teachingExperience || 0) ||
    sortedJson(formData.focusAreas) !== sortedJson(user.focusAreas || []) ||
    sortedJson(formData.dialects) !== sortedJson(user.dialects || [])
  ) : false;

  const handleDiscard = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImageUrl: user.profileImageUrl || "",
        chineseLevel: user.chineseLevel || "",
        nativeLanguage: user.nativeLanguage || "",
        focusAreas: user.focusAreas || [],
        city: user.city || "",
        teachingExperience: user.teachingExperience || 0,
        dialects: user.dialects || []
      });
    }
  };

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
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuyCredits = async (usd: number) => {
    setCheckoutLoading(usd);
    try {
      const res = await apiRequest("POST", "/api/stripe/checkout", { usd });
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

  const isReviewer = user?.role === 'reviewer';
  const balance = creditData?.creditBalance ?? 0;
  const freeBalance = creditData?.freeCreditsBalance ?? 0;
  const isUnlimited = creditData?.isUnlimited ?? false;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 animate-in pb-24">
        <h1 className="text-3xl font-bold font-display">Your Profile</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isReviewer ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
            {!isReviewer && <TabsTrigger value="credits" data-testid="tab-credits">Credits</TabsTrigger>}
          </TabsList>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Click any field to edit it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-border/50">
                  <div className="relative group cursor-pointer">
                    <Avatar className="w-24 h-24 border-4 border-primary/10">
                      <AvatarImage src={formData.profileImageUrl} />
                      <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                        {formData.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Label
                      htmlFor="photo-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium"
                    >
                      {isUploading ? "Uploading..." : "Change"}
                      <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {!isReviewer ? (
                  <div className="space-y-6 pt-4">
                    <div
                      ref={chineseLevelRef}
                      className={`space-y-2 rounded-lg p-3 -mx-3 transition-all duration-500 ${highlightLevel ? "bg-primary/10 ring-2 ring-primary/40 animate-pulse" : ""}`}
                    >
                      <Label className={highlightLevel ? "text-primary font-bold" : ""}>Chinese Level</Label>
                      <Select
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

                    <div className="space-y-2">
                      <Label>Native Language</Label>
                      <Select
                        value={formData.nativeLanguage}
                        onValueChange={v => setFormData(p => ({ ...p, nativeLanguage: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your native language" />
                        </SelectTrigger>
                        <SelectContent>
                          {NATIVE_LANGUAGES.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Focus Areas</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {FOCUS_AREA_OPTIONS.map(area => (
                          <div key={area.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`focus-${area.value}`}
                              checked={formData.focusAreas.includes(area.value)}
                              onCheckedChange={(checked) => {
                                setFormData(prev => {
                                  const focusAreas = checked
                                    ? [...prev.focusAreas, area.value]
                                    : prev.focusAreas.filter(v => v !== area.value);
                                  return { ...prev, focusAreas };
                                });
                              }}
                            />
                            <Label htmlFor={`focus-${area.value}`} className="text-sm font-normal cursor-pointer">
                              {area.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Hometown City</Label>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              className="w-full justify-between"
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
          </TabsContent>

          {/* ── Settings Tab ── */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Control how Chinese text is shown throughout the app.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <div className="flex items-center justify-between py-5">
                  <div className="space-y-1 pr-4">
                    <Label htmlFor="toggle-pinyin" className="text-base font-medium">Show pinyin</Label>
                    <p className="text-sm text-muted-foreground">
                      Display tone-coloured pinyin above each Chinese character on recording pages.
                    </p>
                  </div>
                  <Switch
                    id="toggle-pinyin"
                    checked={showPinyin}
                    onCheckedChange={setShowPinyin}
                    data-testid="switch-show-pinyin"
                  />
                </div>

                <div className="flex items-center justify-between py-5">
                  <div className="space-y-1 pr-4">
                    <Label
                      htmlFor="toggle-sandhi"
                      className={`text-base font-medium ${!showPinyin ? "text-muted-foreground" : ""}`}
                    >
                      Show tone sandhi
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When tones change in natural speech (e.g. 你好 → níhǎo), show the "Original" and "As spoken" side-by-side view.
                      {!showPinyin && (
                        <span className="block mt-1 italic">Turn on pinyin to enable this option.</span>
                      )}
                    </p>
                  </div>
                  <Switch
                    id="toggle-sandhi"
                    checked={showSandhi}
                    onCheckedChange={setShowSandhi}
                    disabled={!showPinyin}
                    data-testid="switch-show-sandhi"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose when you'd like to receive email updates.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <div className="flex items-center justify-between py-5">
                  <div className="space-y-1 pr-4">
                    <Label htmlFor="toggle-email-notifications" className="text-base font-medium">
                      {user?.role === "reviewer"
                        ? "Email me when a new recording is submitted"
                        : "Email me when I receive feedback"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {user?.role === "reviewer"
                        ? "Get an email whenever a learner submits a new recording for review."
                        : "Get an email whenever a reviewer leaves feedback on one of your recordings."}
                      {!user?.email && (
                        <span className="block mt-1 italic text-amber-600">No email address is associated with your account — notifications cannot be sent.</span>
                      )}
                    </p>
                  </div>
                  <Switch
                    id="toggle-email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={handleEmailNotificationsChange}
                    disabled={!user?.email}
                    data-testid="switch-email-notifications"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Credits Tab (learners only) ── */}
          {!isReviewer && (
            <TabsContent value="credits" className="mt-6 space-y-6">
              {/* Balance card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent" data-testid="credit-balance-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <CircleDollarSign className="w-9 h-9 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-semibold uppercase tracking-wider text-muted-foreground">Your balance</p>
                        <p className="text-5xl font-bold font-display text-foreground" data-testid="profile-credit-balance">
                          {isUnlimited ? "∞" : balance}
                        </p>
                        <p className="text-lg font-normal text-foreground">credits</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1.5 text-base text-muted-foreground">
                        <Shield className="w-4.5 h-4.5" />
                        <span>{freeBalance} free</span>
                      </div>
                      <p className="text-base text-muted-foreground">1 credit = 1 character</p>
                      <p className="text-base text-muted-foreground">{REFUND_THRESHOLD}%+ score → refunded</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How credits work */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">How credits work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-lg text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>You received <strong>{SIGNUP_BONUS} free credits</strong> when you joined.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <span><strong>+{DAILY_REWARD} free credit per day</strong> (up to 3 banked at a time).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDollarSign className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Recording a phrase costs <strong>1 credit per Chinese character</strong> (max {10} chars per session).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <RotateCcw className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Score <strong>{REFUND_THRESHOLD}% or higher</strong> on a recording and your credits are automatically refunded.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Credit packs */}
              <div>
                <h2 className="text-2xl font-semibold mb-3">Buy credits</h2>
                <Card className="border-border/60 overflow-hidden">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Credits</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Value</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {CREDIT_PACKS.map(pack => (
                        <tr key={pack.usd} className="hover:bg-muted/20 transition-colors" data-testid={`credit-pack-${pack.usd}`}>
                          <td className="px-4 py-3.5 font-semibold">${pack.usd}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold">{pack.credits}</span>
                            {pack.highlight && (
                              <span className={`ml-3 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                                pack.highlight === "most_popular"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-amber-400 text-amber-950"
                              }`}>
                                {pack.highlight === "most_popular" ? "Most Popular" : "Best Value"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground text-sm hidden sm:table-cell w-24">
                            {(pack.usd / pack.credits * 100).toFixed(1)}¢ each
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              disabled={checkoutLoading === pack.usd}
                              onClick={() => handleBuyCredits(pack.usd)}
                              data-testid={`buy-pack-${pack.usd}`}
                              className="min-w-[100px] font-bold bg-primary hover:bg-primary/85 active:bg-primary/75 text-primary-foreground transition-colors"
                            >
                              {checkoutLoading === pack.usd ? (
                                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing...</>
                              ) : (
                                "Buy"
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Transaction history */}
              <div>
                <h2 className="text-2xl font-semibold mb-3">Transaction history</h2>
                {!transactions || transactions.length === 0 ? (
                  <p className="text-lg text-muted-foreground py-6 text-center">No transactions yet.</p>
                ) : (
                  <Card className="border-border/60 divide-y divide-border/50">
                    {transactions.slice(0, 20).map((tx: any) => {
                      const { label, color, icon: Icon } = txTypeLabel(tx.type);
                      const isPositive = tx.amount > 0;
                      return (
                        <div key={tx.id} className="flex items-center justify-between px-4 py-3.5" data-testid={`tx-row-${tx.id}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-muted/50 ${color}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <p className="text-base font-medium">{label}</p>
                              <p className="text-sm text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy")}</p>
                            </div>
                          </div>
                          <span className={`text-base font-bold ${isPositive ? "text-emerald-600" : "text-amber-600"}`}>
                            {isPositive ? "+" : ""}{tx.amount}
                          </span>
                        </div>
                      );
                    })}
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Fixed save bar — slides in when form is dirty */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isDirty ? "translate-y-0" : "translate-y-full"
        }`}
        data-testid="profile-save-bar"
      >
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                disabled={isSaving}
                data-testid="btn-discard-profile"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                data-testid="btn-save-profile"
              >
                {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
