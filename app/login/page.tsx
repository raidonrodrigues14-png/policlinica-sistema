'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Credenciais dos profissionais
const PROFISSIONAIS = [
  { 
    id: 'recepcionista', 
    label: 'Recepcionista', 
    cor: '#22c55e', 
    emoji: '🖥️',
    usuario: 'recepcao',
    senha: '123'
  },
  { 
    id: 'enfermeiro', 
    label: 'Enfermagem', 
    cor: '#3b82f6', 
    emoji: '🩺',
    usuario: 'enfermeiro',
    senha: '123'
  },
  { 
    id: 'medico', 
    label: 'Médico', 
    cor: '#ec4899', 
    emoji: '👨‍⚕️',
    usuario: 'medico',
    senha: '123'
  },
  { 
    id: 'gestor', 
    label: 'Gestor', 
    cor: '#f59e0b', 
    emoji: '📊',
    usuario: 'gestor',
    senha: '123'
  }
]

// Rotas por perfil
const rotasPorPerfil = {
  recepcionista: '/recepcao',
  enfermeiro: '/triagem',
  medico: '/gestao',
  gestor: '/gestao'
}

export default function Login() {
  const router = useRouter()
  const [perfilSelecionado, setPerfilSelecionado] = useState('recepcionista')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const profissional = PROFISSIONAIS.find(x => x.id === perfilSelecionado)
  const cor = profissional?.cor || '#3ECF8E'

  function fazerLogin() {
    setErro('')
    
    // Validar usuário e senha
    if (!usuario || !senha) {
      setErro('Preencha usuário e senha')
      return
    }

    const credenciaisValidas = PROFISSIONAIS.find(
      p => p.id === perfilSelecionado && p.usuario === usuario && p.senha === senha
    )

    if (credenciaisValidas) {
      // Salvar dados do usuário
      localStorage.setItem('usuario', JSON.stringify({
        nome: profissional?.label,
        perfil: perfilSelecionado,
        usuario: usuario
      }))
      
      // Redirecionar para a rota correta
      const rota = rotasPorPerfil[perfilSelecionado as keyof typeof rotasPorPerfil]
      router.replace(rota)
    } else {
      setErro('Usuário ou senha inválidos para este perfil')
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      fazerLogin()
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      {/* Lado esquerdo - Informações */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg,#0c1424,#0f2040)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 64
      }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
          Alto Alegre do Maranhão<br />
          <span style={{ color: '#3ECF8E' }}>Especialidades médicas</span>
        </div>
        <p style={{ fontSize: 14, color: '#7a9cc4', lineHeight: 1.7, maxWidth: 400 }}>
          Prontuário eletrônico para toda a equipe de saúde. Acesso seguro e personalizado para cada profissional.
        </p>
        
        {/* Informações de teste */}
        <div style={{ 
          marginTop: 40, 
          padding: 16, 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: 12,
          maxWidth: 400
        }}>
          <p style={{ fontSize: 12, color: '#7a9cc4', marginBottom: 8 }}>🔐 Credenciais de teste:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11 }}>
            <span style={{ color: '#22c55e' }}>🖥️ Recepção:</span>
            <span style={{ color: '#94a3b8' }}>recepcao / 123</span>
            <span style={{ color: '#3b82f6' }}>🩺 Enfermagem:</span>
            <span style={{ color: '#94a3b8' }}>enfermeiro / 123</span>
            <span style={{ color: '#ec4899' }}>👨‍⚕️ Médico:</span>
            <span style={{ color: '#94a3b8' }}>medico / 123</span>
            <span style={{ color: '#f59e0b' }}>📊 Gestor:</span>
            <span style={{ color: '#94a3b8' }}>gestor / 123</span>
          </div>
        </div>
      </div>

      {/* Lado direito - Formulário de login */}
      <div style={{
        width: 420,
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            Entrar no sistema
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            Escolha seu perfil e informe suas credenciais
          </p>

          {/* Seleção de perfil */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {PROFISSIONAIS.map(x => (
              <div
                key={x.id}
                onClick={() => {
                  setPerfilSelecionado(x.id)
                  setUsuario('')
                  setSenha('')
                  setErro('')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '2px solid ' + (perfilSelecionado === x.id ? x.cor : '#e2e8f0'),
                  background: perfilSelecionado === x.id ? x.cor + '15' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 20 }}>{x.emoji}</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: perfilSelecionado === x.id ? x.cor : '#0f172a'
                }}>
                  {x.label}
                </span>
              </div>
            ))}
          </div>

          {/* Campo Usuário */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Digite seu usuário (ex: ${profissional?.usuario})`}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 13,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = cor}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Campo Senha */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua senha"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 13,
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = cor}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#64748b'
                }}
              >
                {mostrarSenha ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              fontSize: 12,
              color: '#991b1b'
            }}>
              {erro}
            </div>
          )}

          {/* Botão de login */}
          <button
            onClick={fazerLogin}
            style={{
              width: '100%',
              padding: 13,
              background: cor,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.2s, opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Entrar como {profissional?.label} →
          </button>

          {/* Informação de demonstração */}
          <p style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#94a3b8',
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid #e2e8f0'
          }}>
            Sistema de Prontuário Eletrônico v1.0
          </p>
        </div>
      </div>
    </div>
  )
  }