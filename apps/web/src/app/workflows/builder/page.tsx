import { redirect } from "next/navigation";

type WorkflowBuilderRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkflowBuilderRedirectPage({
  searchParams,
}: WorkflowBuilderRedirectPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  redirect(`/dashboard/workflows/builder${queryString ? `?${queryString}` : ""}`);
}
