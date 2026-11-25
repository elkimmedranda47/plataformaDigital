import MagazineViewer from "@/components/magazine/MagazineViewer";
import ArticulosPublicados from "@/components/revista/ArticulosPublicados";

export default function RevistaPage() {
  return (
    <div className="bg-white">
      <MagazineViewer />
      <ArticulosPublicados />
    </div>
  );
}
