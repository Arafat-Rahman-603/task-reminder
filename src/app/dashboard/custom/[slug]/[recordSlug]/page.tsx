import { getCustomSections, getCustomFields, getCustomRecordBySlug } from "@/actions/customSection.actions";
import { notFound } from "next/navigation";
import CustomRecordDetailClient from "./CustomRecordDetailClient";

export default async function CustomRecordPage(
  props: {
    params: Promise<{ slug: string, recordSlug: string }>;
  }
) {
  const params = await props.params;
  const { sections } = await getCustomSections();
  const section = sections.find((s: any) => s.slug === params.slug);

  if (!section) {
    return notFound();
  }

  const [{ fields }, { record }] = await Promise.all([
    getCustomFields(section._id),
    getCustomRecordBySlug(section._id, params.recordSlug),
  ]);

  if (!record) {
    return notFound();
  }

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-3xl">
      <CustomRecordDetailClient 
        section={JSON.parse(JSON.stringify(section))} 
        fields={JSON.parse(JSON.stringify(fields))} 
        record={JSON.parse(JSON.stringify(record))} 
      />
    </div>
  );
}
