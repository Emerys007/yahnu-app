import { PublicOrganizationDirectory } from "@/components/organizations/public-directory-client";
import { listPublicOrganizations, type PublicOrganization } from "@/lib/public-organizations-server";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  let schools: PublicOrganization[] = [];
  let unavailable = false;

  try {
    schools = await listPublicOrganizations("school");
  } catch (error) {
    unavailable = true;
    console.error("Unable to load the public schools directory.", error);
  }

  return (
    <PublicOrganizationDirectory
      kind="school"
      organizations={schools}
      unavailable={unavailable}
    />
  );
}
