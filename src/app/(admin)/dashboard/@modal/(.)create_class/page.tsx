// import { getServerUser } from "@/auth-server";
import CreatingClassForm from "@/components/form/create_classes";
import { Modal } from "@/components/modal";
// import { redirect } from "next/navigation";

export default async function CreateClassModalPage() {
  // const user = await getServerUser();

  // if (user?.role !== "ADMIN") {
  //   redirect("/dashboard");
  // }

  return (
    <Modal className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
      <CreatingClassForm />
    </Modal>
  );
}
