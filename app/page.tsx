export default function Home() {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>🏥 Policlinica</h1>
      <p>Sistema de Gestão Hospitalar</p>
      
      <div style={{ marginTop: "30px" }}>
        <a href="/login">
          <button style={{ 
            padding: "12px 24px", 
            fontSize: "16px", 
            backgroundColor: "#3ECF8E",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}>
            Acessar Sistema
          </button>
        </a>
      </div>

      <div style={{ marginTop: "50px", display: "flex", gap: "20px", justifyContent: "center" }}>
        <a href="/login">Login</a>
        <a href="/triagem">Triagem</a>
        <a href="/painel">Painel</a>
        <a href="/prontuario">Prontuário</a>
      </div>
    </div>
  );
}
