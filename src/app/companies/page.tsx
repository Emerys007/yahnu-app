import { PublicOrganizationDirectory } from "@/components/organizations/public-directory-client";
import { listPublicOrganizations, type PublicOrganization } from "@/lib/public-organizations-server";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  let companies: PublicOrganization[] = [];
  let unavailable = false;

  try {
    companies = await listPublicOrganizations("company");
  } catch (error) {
    unavailable = true;
    console.error("Unable to load the public companies directory.", error);
  }

  return (
    <PublicOrganizationDirectory
      kind="company"
      organizations={companies}
      unavailable={unavailable}
    />
  );
}
