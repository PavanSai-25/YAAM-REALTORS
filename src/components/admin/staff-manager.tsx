"use client"

import { Loader2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createUser, updateUserRole } from "@/app/actions/admin"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ROLE_LABELS, ROLES, type Role } from "@/config/property-options"
import { formatDate } from "@/lib/format"
import type { UserProfile } from "@/types/domain"

const ROLE_HELP: Record<Role, string> = {
  admin: "Everything, including users and settings",
  staff: "Properties and enquiries",
  seller: "Own submissions only",
}

export function StaffManager({ users, currentUserId, canCreate }: { users: UserProfile[]; currentUserId: string; canCreate: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ fullName: "", email: "", role: "staff" as Role, password: "" })

  const changeRole = (userId: string, role: string) =>
    start(async () => {
      const res = await updateUserRole({ userId, role })
      if (res.ok) {
        toast.success("Role updated.")
        router.refresh()
      } else toast.error(res.error)
    })

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" disabled={!canCreate} title={canCreate ? undefined : "Requires SUPABASE_SERVICE_ROLE_KEY"} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-50">
              <UserPlus className="size-4" aria-hidden /> Add user
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                start(async () => {
                  const res = await createUser(form)
                  if (res.ok) {
                    toast.success(`${form.fullName} can now sign in.`)
                    setOpen(false)
                    setForm({ fullName: "", email: "", role: "staff", password: "" })
                    router.refresh()
                  } else toast.error(res.error)
                })
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Add a user</DialogTitle>
                <DialogDescription>Share the password with them securely. They can sign in at /admin.</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="u-name">Full name</Label>
                <Input id="u-name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-email">Email</Label>
                <Input id="u-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-role">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                  <SelectTrigger id="u-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]} — {ROLE_HELP[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-pass">Temporary password</Label>
                <Input id="u-pass" type="password" minLength={10} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <p className="text-xs text-ink-muted">At least 10 characters.</p>
              </div>
              <DialogFooter>
                <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">
                  {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Create user
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-canvas/60 text-left text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">
                  {u.fullName || "—"}
                  {u.id === currentUserId && <span className="ml-2 text-xs font-normal text-ink-muted">(you)</span>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <Select value={u.role} onValueChange={(v) => changeRole(u.id, v)} disabled={pending || u.id === currentUserId}>
                    <SelectTrigger aria-label={`Role for ${u.fullName || u.email}`} className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
