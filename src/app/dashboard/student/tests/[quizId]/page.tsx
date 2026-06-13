import ClientPage from "./ClientPage";

export function generateStaticParams() {
  return [{ certId: "default", courseId: "default", quizId: "default" }];
}

export default function Page({ params }: any) {
  return <ClientPage params={params} />;
}
