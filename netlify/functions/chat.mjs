export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "https://teamhypium.com.tr",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Sadece POST isteği kabul edilir." }),
      { status: 405, headers }
    );
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Geçerli bir mesaj gönderilmedi." }),
        { status: 400, headers }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: "Mesaj en fazla 500 karakter olabilir." }),
        { status: 400, headers }
      );
    }

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  model: "Qwen/Qwen2.5-7B-Instruct-1M:fastest",
  messages: [
    {
      role: "system",
      content: `
Sen Hypium FRC Team #11920 web sitesi için çalışan resmi yapay zeka asistanısın.

Sadece şu konularda yardımcı ol:
- Hypium FRC Team
- FIRST Robotics Competition (FRC)
- Team #11920
- takımın projeleri
- takım yapısı
- sponsorluk
- takım hedefleri
- takım iletişim bilgileri
- Düzce Fen Lisesi

Kurallar:
- Bilmediğin bilgiyi uydurma.
- Kısa, anlaşılır ve profesyonel cevap ver.
- Türkçe soruya Türkçe cevap ver.
- İngilizce soruya İngilizce cevap ver.
- Hypium ile ilgisiz sorulara yalnızca Hypium ve FRC hakkında yardımcı olabileceğini söyle.
      `.trim(),
    },
    {
      role: "user",
      content: message,
    },
  ],

  max_tokens: 500,
temperature: 0.7,
top_p: 0.8,

  

  chat_template_kwargs: {
    enable_thinking: false
  }
}),

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face error:", errorText);

      return new Response(
        JSON.stringify({
          error: "AI servisine şu anda ulaşılamıyor.",
        }),
        { status: 502, headers }
      );
    }

    const data = await response.json();

    console.log("HF RESPONSE:", JSON.stringify(data));

const messageData = data?.choices?.[0]?.message;

const answer =
  messageData?.content ||
  messageData?.reasoning_content ||
  data?.generated_text ||
  "Şu anda cevap oluşturamadım.";
    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: "Sunucuda bir hata oluştu.",
      }),
      { status: 500, headers }
    );
  }
};
