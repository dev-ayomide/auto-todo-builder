"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { usePipeSettings } from "@/lib/hooks/use-pipe-settings"
import { toast } from "sonner"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, loading } = usePipeSettings()
  const [localSettings, setLocalSettings] = useState({
    scanInterval: settings?.scanInterval || 5,
    enableNotifications: settings?.enableNotifications || true,
    enableAutoDetection: settings?.enableAutoDetection || true,
    priorityKeywords: settings?.priorityKeywords || {
      high: "urgent,asap,immediately,critical",
      medium: "soon,important,needed",
      low: "whenever,low priority,eventually",
    },
    scanSources: settings?.scanSources || {
      email: true,
      chat: true,
      browser: true,
      documents: true,
      code: true,
    },
    reminderTiming: settings?.reminderTiming || {
      highPriority: 30,
      mediumPriority: 120,
      lowPriority: 360,
    },
  })

  const handleSave = async () => {
    try {
      await updateSettings(localSettings)
      toast.success("Settings saved successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to save settings")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure how Auto-Todo Builder detects and manages your tasks</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receive desktop notifications for new tasks
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={localSettings.enableNotifications}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, enableNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoDetection">Auto-detection</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Automatically detect tasks from screen content
                  </p>
                </div>
                <Switch
                  id="autoDetection"
                  checked={localSettings.enableAutoDetection}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, enableAutoDetection: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Scan interval (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[localSettings.scanInterval]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={(value) => setLocalSettings({ ...localSettings, scanInterval: value[0] })}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">{localSettings.scanInterval}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reminder timing (minutes)</Label>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="highPriority" className="text-sm">
                      High priority
                    </Label>
                    <Input
                      id="highPriority"
                      type="number"
                      min={5}
                      value={localSettings.reminderTiming.highPriority}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          reminderTiming: {
                            ...localSettings.reminderTiming,
                            highPriority: Number.parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="mediumPriority" className="text-sm">
                      Medium priority
                    </Label>
                    <Input
                      id="mediumPriority"
                      type="number"
                      min={5}
                      value={localSettings.reminderTiming.mediumPriority}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          reminderTiming: {
                            ...localSettings.reminderTiming,
                            mediumPriority: Number.parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="lowPriority" className="text-sm">
                      Low priority
                    </Label>
                    <Input
                      id="lowPriority"
                      type="number"
                      min={5}
                      value={localSettings.reminderTiming.lowPriority}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          reminderTiming: {
                            ...localSettings.reminderTiming,
                            lowPriority: Number.parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Scan email clients (Gmail, Outlook, etc.)
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={localSettings.scanSources.email}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      scanSources: {
                        ...localSettings.scanSources,
                        email: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="chat">Chat</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Scan chat applications (Slack, Discord, Teams)
                  </p>
                </div>
                <Switch
                  id="chat"
                  checked={localSettings.scanSources.chat}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      scanSources: {
                        ...localSettings.scanSources,
                        chat: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="browser">Browser</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Scan browser content (GitHub, JIRA, etc.)
                  </p>
                </div>
                <Switch
                  id="browser"
                  checked={localSettings.scanSources.browser}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      scanSources: {
                        ...localSettings.scanSources,
                        browser: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="documents">Documents</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Scan document applications (Word, Google Docs)
                  </p>
                </div>
                <Switch
                  id="documents"
                  checked={localSettings.scanSources.documents}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      scanSources: {
                        ...localSettings.scanSources,
                        documents: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Scan code editors and IDEs</p>
                </div>
                <Switch
                  id="code"
                  checked={localSettings.scanSources.code}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      scanSources: {
                        ...localSettings.scanSources,
                        code: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="highPriorityKeywords">High priority keywords</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comma-separated keywords that indicate high priority tasks
                </p>
                <Input
                  id="highPriorityKeywords"
                  value={localSettings.priorityKeywords.high}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      priorityKeywords: {
                        ...localSettings.priorityKeywords,
                        high: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediumPriorityKeywords">Medium priority keywords</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comma-separated keywords that indicate medium priority tasks
                </p>
                <Input
                  id="mediumPriorityKeywords"
                  value={localSettings.priorityKeywords.medium}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      priorityKeywords: {
                        ...localSettings.priorityKeywords,
                        medium: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowPriorityKeywords">Low priority keywords</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comma-separated keywords that indicate low priority tasks
                </p>
                <Input
                  id="lowPriorityKeywords"
                  value={localSettings.priorityKeywords.low}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      priorityKeywords: {
                        ...localSettings.priorityKeywords,
                        low: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

