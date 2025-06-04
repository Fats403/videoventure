"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Camera,
  Mail,
  Moon,
  Sun,
  Monitor,
  Key,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap,
  Volume2,
  VolumeX,
  FileText,
  ExternalLink,
  Save,
} from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mock user data - in real app this would come from your API
  const [userSettings, setUserSettings] = useState({
    // Profile
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corp",
    website: "https://acme.com",
    bio: "Creative director passionate about AI-powered video creation.",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",

    // Preferences
    theme: "system",
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    videoProcessingAlerts: true,
    weeklyReports: true,
    soundEnabled: true,

    // Privacy
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    analyticsOptIn: true,

    // Video Defaults
    defaultAspectRatio: "16:9",
    defaultVideoModel: "standard",
    defaultVideoStyle: "none",
    autoSaveEnabled: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success toast in real app
  };

  const handleDeleteAccount = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    // In real app, this would call your API to delete the account
    console.log("Deleting account...");
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-lg">
            Manage your account preferences and configuration
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="text-primary h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="border-primary/20 h-24 w-24 overflow-hidden rounded-full border-4">
                    <Image
                      src={userSettings.avatar}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  </div>
                  <Button
                    size="icon"
                    className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Profile Picture</h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Upload a new profile picture. JPG, PNG or GIF (max 5MB)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Upload New
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={userSettings.firstName}
                    onChange={(e) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={userSettings.lastName}
                    onChange={(e) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={userSettings.email}
                  onChange={(e) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userSettings.phone}
                    onChange={(e) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={userSettings.company}
                    onChange={(e) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={userSettings.website}
                  onChange={(e) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={userSettings.bio}
                  onChange={(e) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                />
                <p className="text-muted-foreground text-xs">
                  {userSettings.bio.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Appearance */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="text-primary h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={userSettings.theme}
                    onValueChange={(value) =>
                      setUserSettings((prev) => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={userSettings.language}
                    onValueChange={(value) =>
                      setUserSettings((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={userSettings.timezone}
                    onValueChange={(value) =>
                      setUserSettings((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Video Defaults */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="text-primary h-5 w-5" />
                  Video Defaults
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Aspect Ratio</Label>
                  <Select
                    value={userSettings.defaultAspectRatio}
                    onValueChange={(value) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        defaultAspectRatio: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Video Model</Label>
                  <Select
                    value={userSettings.defaultVideoModel}
                    onValueChange={(value) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        defaultVideoModel: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="experimental">Experimental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save Projects</Label>
                    <p className="text-muted-foreground text-sm">
                      Automatically save your work every 30 seconds
                    </p>
                  </div>
                  <Switch
                    checked={userSettings.autoSaveEnabled}
                    onCheckedChange={(checked) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        autoSaveEnabled: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Email Notifications */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="text-primary h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationToggle
                  title="General Notifications"
                  description="Receive email notifications for account activity"
                  checked={userSettings.emailNotifications}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      emailNotifications: checked,
                    }))
                  }
                />
                <NotificationToggle
                  title="Video Processing Alerts"
                  description="Get notified when your videos are ready"
                  checked={userSettings.videoProcessingAlerts}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      videoProcessingAlerts: checked,
                    }))
                  }
                />
                <NotificationToggle
                  title="Weekly Reports"
                  description="Receive weekly analytics and usage reports"
                  checked={userSettings.weeklyReports}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      weeklyReports: checked,
                    }))
                  }
                />
                <NotificationToggle
                  title="Marketing Emails"
                  description="Receive updates about new features and promotions"
                  checked={userSettings.marketingEmails}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      marketingEmails: checked,
                    }))
                  }
                />
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="text-primary h-5 w-5" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationToggle
                  title="Browser Notifications"
                  description="Receive push notifications in your browser"
                  checked={userSettings.pushNotifications}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      pushNotifications: checked,
                    }))
                  }
                />
                <NotificationToggle
                  title="Sound Notifications"
                  description="Play sound when receiving notifications"
                  checked={userSettings.soundEnabled}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      soundEnabled: checked,
                    }))
                  }
                  icon={
                    userSettings.soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Password & Authentication */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="text-primary h-5 w-5" />
                  Password & Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button className="w-full">Update Password</Button>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-muted-foreground text-sm">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="text-primary h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select
                    value={userSettings.profileVisibility}
                    onValueChange={(value) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        profileVisibility: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <NotificationToggle
                  title="Show Email Address"
                  description="Display your email on your public profile"
                  checked={userSettings.showEmail}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({ ...prev, showEmail: checked }))
                  }
                />

                <NotificationToggle
                  title="Show Phone Number"
                  description="Display your phone number on your profile"
                  checked={userSettings.showPhone}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({ ...prev, showPhone: checked }))
                  }
                />

                <NotificationToggle
                  title="Analytics Opt-in"
                  description="Help us improve by sharing anonymous usage data"
                  checked={userSettings.analyticsOptIn}
                  onChange={(checked) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      analyticsOptIn: checked,
                    }))
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-2 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-700 dark:text-red-300">
                    Delete Account
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="text-primary h-5 w-5" />
                Billing Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-primary text-2xl font-bold">Pro</div>
                  <div className="text-muted-foreground text-sm">
                    Current Plan
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">$29</div>
                  <div className="text-muted-foreground text-sm">Monthly</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">Feb 15</div>
                  <div className="text-muted-foreground text-sm">
                    Next Billing
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Invoice
                </Button>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "Jan 15, 2024", amount: "$29.00", status: "Paid" },
                  { date: "Dec 15, 2023", amount: "$29.00", status: "Paid" },
                  { date: "Nov 15, 2023", amount: "$29.00", status: "Paid" },
                ].map((invoice, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <div>
                        <div className="font-medium">{invoice.date}</div>
                        <div className="text-muted-foreground text-sm">
                          Pro Plan
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {invoice.status}
                      </Badge>
                      <span className="font-medium">{invoice.amount}</span>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
              <h4 className="mb-2 font-medium text-red-800 dark:text-red-200">
                What will be deleted:
              </h4>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                <li>• All your videos and projects</li>
                <li>• Your account settings and preferences</li>
                <li>• Billing history and subscription</li>
                <li>• All associated data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmDelete">
                Type &quot;DELETE&quot; to confirm:
              </Label>
              <Input id="confirmDelete" placeholder="DELETE" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAccount}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationToggle({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="font-medium">{title}</Label>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
