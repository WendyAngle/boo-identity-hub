import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/outreach/")({
  head: () => ({ meta: [{ title: "触达客户管理 | Boo数据平台" }] }),
  component: () => (
    <PagePlaceholder
      breadcrumb={["触达客户管理"]}
      title="触达客户管理"
      subtitle="该模块功能建设中，敬请期待"
    />
  ),
});