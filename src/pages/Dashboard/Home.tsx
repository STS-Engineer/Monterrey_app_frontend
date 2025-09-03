import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 flex justify-center items-center">
          <img
            src="/images/IMG_20210820_091858 (1).jpg"
            alt="Coming Soon"
            className="rounded-xl shadow-lg max-w-lg"
          />
        </div>
      </div>
    </>
  );
}
