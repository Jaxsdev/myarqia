import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
    const navigate = useNavigate()
    const [modo, setModo] = useState<'login' | 'registro'>('login')
    const [email, setEmail] = useState('')
    const [password, setPass] = useState('')
    const [error, setError] = useState('')
    const [ok, setOk] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        setError(''); setOk(''); setLoading(true)

        if (modo === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) setError('Correo o contraseña incorrectos.')
            else navigate('/dashboard')
        } else {
            const { error } = await supabase.auth.signUp({ email, password })
            if (error) setError('No se pudo crear la cuenta.')
            else setOk('Cuenta creada. Revisa tu correo para confirmar.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-950 flex">

            {/* Panel izquierdo — Presentación */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 border-r border-gray-800 p-12">
                <div>
                    <h1 className="text-4xl font-black text-blue-500 tracking-tight">MyARQIA</h1>
                    <p className="text-gray-400 mt-2 text-sm">My Architecture + Artificial Intelligence</p>
                </div>

                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-white leading-tight">
                        Diseña planos<br />
                        <span className="text-blue-400">hablando en español</span>
                    </h2>

                    {[
                        { icon: '🤖', title: 'IA Conversacional', desc: 'Describe tu proyecto y la IA genera la planta automáticamente' },
                        { icon: '📐', title: 'CAD Profesional', desc: 'Herramientas de edición con capas compatibles con AutoCAD' },
                        { icon: '📋', title: 'Verifica el RNE', desc: 'Comprueba automáticamente el cumplimiento normativo' },
                        { icon: '📄', title: 'Exporta al instante', desc: 'PDF con cajetín y DXF compatible con AutoCAD' },
                    ].map((f) => (
                        <div key={f.title} className="flex items-start gap-4">
                            <span className="text-2xl">{f.icon}</span>
                            <div>
                                <p className="text-white font-semibold text-sm">{f.title}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-gray-700 text-xs">
                    Hecho en Latinoamérica 🏗️ · Diseñado para arquitectos peruanos y de toda la región
                </p>
            </div>

            {/* Panel derecho — Login */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">

                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-4xl font-black text-blue-500">MyARQIA</h1>
                        <p className="text-gray-500 text-sm mt-1">Diseño arquitectónico con IA</p>
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                        <h2 className="text-white text-xl font-bold mb-1">
                            {modo === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta gratis'}
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                            {modo === 'login'
                                ? 'Ingresa a tu espacio de diseño'
                                : 'Empieza a diseñar en minutos'}
                        </p>

                        {/* Tabs */}
                        <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
                            {(['login', 'registro'] as const).map((m) => (
                                <button key={m} onClick={() => setModo(m)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                    ${modo === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                    {m === 'login' ? 'Ingresar' : 'Registrarse'}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wide">
                                    Correo electrónico
                                </label>
                                <input type="email" value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="tu@correo.com"
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm transition-colors" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wide">
                                    Contraseña
                                </label>
                                <input type="password" value={password}
                                    onChange={(e) => setPass(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm transition-colors" />
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}
                        {ok && (
                            <div className="mt-4 bg-green-900/30 border border-green-700/50 text-green-300 text-sm px-4 py-3 rounded-xl">
                                {ok}
                            </div>
                        )}

                        <button onClick={handleSubmit}
                            disabled={loading || !email || !password}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                            {loading ? 'Cargando...' : modo === 'login' ? 'Ingresar a MyARQIA' : 'Crear cuenta gratis'}
                        </button>
                    </div>

                    <p className="text-center text-gray-700 text-xs mt-6">
                        MyARQIA Beta · Hecho con ❤️ en Latinoamérica
                    </p>
                </div>
            </div>
        </div>
    )
}