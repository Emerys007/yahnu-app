import { redirect } from "next/navigation"

export default function TeamRedirectPage() {
  redirect("/dashboard/admin/manage-team")
}
