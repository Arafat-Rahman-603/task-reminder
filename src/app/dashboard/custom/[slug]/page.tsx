/* eslint-disable @typescript-eslint/no-explicit-any -- Unavoidable dynamic db payload */
import { getCustomSections, getCustomFields, getCustomRecords } from "@/actions/customSection.actions";
import { notFound } from "next/navigation";
import CustomSectionClient from "./CustomSectionClient";
import CustomDashboardClient from "./CustomDashboardClient";
import { getDashboardBlocks } from "@/actions/dashboard.actions";

export default async function CustomSectionPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const { sections } = await getCustomSections();
  const section = sections.find((s: any) => s.slug === params.slug);

  if (!section) {
    return notFound();
  }

  const [{ fields }, { records }, { blocks }] = await Promise.all([
    getCustomFields(section._id),
    getCustomRecords(section._id),
    getDashboardBlocks(section._id),
  ]);

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-5xl">
      {section.layout === 'dashboard' ? (
        <CustomDashboardClient 
          section={JSON.parse(JSON.stringify(section))} 
          fields={JSON.parse(JSON.stringify(fields))} 
          records={JSON.parse(JSON.stringify(records))} 
          initialBlocks={JSON.parse(JSON.stringify(blocks))} 
        />
      ) : (
        <CustomSectionClient 
          section={JSON.parse(JSON.stringify(section))} 
          fields={JSON.parse(JSON.stringify(fields))} 
          initialRecords={JSON.parse(JSON.stringify(records))} 
          initialBlocks={JSON.parse(JSON.stringify(blocks))} 
        />
      )}
    </div>
  );
}
