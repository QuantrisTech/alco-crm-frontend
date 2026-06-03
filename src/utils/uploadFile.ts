export const uploadFile = async (file: File, type: "audio" | "video" | "document") => {
  const formData = new FormData();
  formData.append(type, file);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/programs/upload-${type}`,
    {
      method: "POST",
      body: formData, // ❗ content-type mat lagana
    }
  );

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();

  // 🔥 expected: { url: "..." }
  return data.url;
};

export const uploadResourceImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lms/resources/upload-image`,
    {
      method:  "POST",
      body:    formData,
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );

  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.url;
};

export const uploadResourcePdf = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("pdf", file);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lms/resources/upload-pdf`,
    {
      method:  "POST",
      body:    formData,
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );

  if (!res.ok) throw new Error("PDF upload failed");
  const data = await res.json();
  return data.url;
};