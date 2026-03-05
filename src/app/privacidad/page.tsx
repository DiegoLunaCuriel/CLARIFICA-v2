import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Aviso de Privacidad — CLARIFICA",
    description: "Aviso de privacidad de CLARIFICA, hub de construcción inteligente.",
};

export default function PrivacidadPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
            {/* Header */}
            <header className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Aviso de Privacidad
                </h1>
                <p className="text-sm text-muted-foreground">
                    Última actualización: 4 de marzo de 2026
                </p>
            </header>

            {/* Content */}
            <article className="prose prose-invert prose-amber max-w-none space-y-8 text-muted-foreground leading-relaxed">
                {/* 1 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">1. Identidad del Responsable</h2>
                    <p>
                        <strong className="text-foreground">CLARIFICA</strong> (en adelante, "la Plataforma"), con domicilio en México,
                        es responsable del tratamiento de los datos personales que nos proporcione, de conformidad
                        con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
                        (LFPDPPP) y demás normatividad aplicable.
                    </p>
                </section>

                {/* 2 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">2. Datos Personales Recabados</h2>
                    <p>Para la prestación de nuestros servicios, podemos recabar los siguientes datos personales:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Nombre completo</li>
                        <li>Dirección de correo electrónico</li>
                        <li>Contraseña (almacenada de forma cifrada)</li>
                        <li>Historial de búsquedas de materiales de construcción</li>
                        <li>Preferencias de uso y configuraciones de la plataforma</li>
                        <li>Datos de navegación y uso (cookies, dirección IP, tipo de dispositivo)</li>
                    </ul>
                    <p>
                        <strong className="text-foreground">No recabamos datos personales sensibles</strong> como datos
                        financieros, bancarios o de tarjetas de crédito.
                    </p>
                </section>

                {/* 3 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">3. Finalidades del Tratamiento</h2>
                    <p>Los datos personales recabados serán utilizados para las siguientes finalidades:</p>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-medium text-foreground mb-1">Finalidades Primarias (necesarias):</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Crear y administrar su cuenta de usuario</li>
                                <li>Proveer acceso a las funcionalidades de búsqueda de materiales de construcción</li>
                                <li>Generar fichas técnicas y recomendaciones personalizadas mediante inteligencia artificial</li>
                                <li>Comparar precios en tiendas como Home Depot México, Mercado Libre y Amazon</li>
                                <li>Guardar historial de búsquedas y preferencias</li>
                                <li>Brindar soporte técnico y atención al usuario</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-foreground mb-1">Finalidades Secundarias (opcionales):</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Enviar notificaciones sobre actualizaciones de la plataforma</li>
                                <li>Realizar análisis estadísticos para mejorar nuestros servicios</li>
                                <li>Personalizar la experiencia del usuario</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 4 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">4. Uso de Inteligencia Artificial</h2>
                    <p>
                        CLARIFICA utiliza servicios de inteligencia artificial (Google Gemini) para generar fichas
                        técnicas, recomendaciones personalizadas y asistencia en la búsqueda de materiales. Los
                        datos proporcionados en las consultas al asistente de IA son procesados únicamente para
                        generar las respuestas solicitadas y <strong className="text-foreground">no se utilizan para entrenar modelos de IA</strong>.
                    </p>
                </section>

                {/* 5 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">5. Transferencia de Datos</h2>
                    <p>
                        Sus datos personales podrán ser compartidos con los siguientes terceros para las
                        finalidades descritas en este aviso:
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="text-left px-4 py-3 font-medium text-foreground">Tercero</th>
                                    <th className="text-left px-4 py-3 font-medium text-foreground">Finalidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="px-4 py-3">Supabase (autenticación)</td>
                                    <td className="px-4 py-3">Gestión de cuentas de usuario y almacenamiento seguro de datos</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Google (Gemini AI)</td>
                                    <td className="px-4 py-3">Procesamiento de consultas de inteligencia artificial</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Vercel (hosting)</td>
                                    <td className="px-4 py-3">Alojamiento y distribución de la plataforma web</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p>
                        No se realizan transferencias de datos personales a terceros con fines comerciales
                        o publicitarios.
                    </p>
                </section>

                {/* 6 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">6. Derechos ARCO</h2>
                    <p>
                        Usted tiene derecho a conocer qué datos personales tenemos, para qué los utilizamos y
                        las condiciones de su uso (<strong className="text-foreground">Acceso</strong>). Asimismo,
                        es su derecho solicitar la corrección de su información personal en caso de que esté
                        desactualizada, sea inexacta o incompleta (<strong className="text-foreground">Rectificación</strong>);
                        que la eliminemos de nuestros registros cuando considere que no está siendo utilizada
                        adecuadamente (<strong className="text-foreground">Cancelación</strong>); así como oponerse
                        al uso de sus datos personales para fines específicos (<strong className="text-foreground">Oposición</strong>).
                    </p>
                    <p>
                        Para ejercer cualquiera de estos derechos, puede enviar una solicitud al correo:
                    </p>
                    <p className="text-foreground font-medium">
                        📧 privacidad@clarifica.com
                    </p>
                </section>

                {/* 7 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">7. Cookies y Tecnologías de Rastreo</h2>
                    <p>
                        La Plataforma utiliza cookies y tecnologías similares para mejorar la experiencia del
                        usuario, recordar preferencias de sesión y realizar análisis de uso. Puede configurar
                        su navegador para rechazar cookies, aunque algunas funcionalidades podrían verse
                        limitadas.
                    </p>
                </section>

                {/* 8 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">8. Medidas de Seguridad</h2>
                    <p>
                        CLARIFICA implementa medidas de seguridad técnicas, administrativas y físicas para
                        proteger sus datos personales contra daño, pérdida, alteración, destrucción o acceso
                        no autorizado, incluyendo:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Cifrado de contraseñas mediante algoritmos seguros</li>
                        <li>Comunicación cifrada (HTTPS/TLS)</li>
                        <li>Autenticación segura mediante Supabase Auth</li>
                        <li>Acceso restringido a bases de datos con políticas de Row Level Security (RLS)</li>
                    </ul>
                </section>

                {/* 9 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">9. Modificaciones al Aviso de Privacidad</h2>
                    <p>
                        Nos reservamos el derecho de efectuar modificaciones o actualizaciones al presente
                        aviso de privacidad. Cualquier cambio será notificado a través de la Plataforma o
                        por correo electrónico.
                    </p>
                </section>

                {/* 10 */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">10. Contacto</h2>
                    <p>
                        Si tiene dudas o comentarios sobre este aviso de privacidad, puede comunicarse con
                        nosotros a través de:
                    </p>
                    <ul className="list-none space-y-1">
                        <li>📧 <span className="text-foreground">privacidad@clarifica.com</span></li>
                        <li>🌐 <span className="text-foreground">clarifica.com</span></li>
                    </ul>
                </section>

                {/* Consent */}
                <section className="pt-4 border-t border-border">
                    <p className="text-sm text-center">
                        Al crear una cuenta y utilizar CLARIFICA, usted manifiesta su consentimiento para el
                        tratamiento de sus datos personales conforme al presente aviso de privacidad.
                    </p>
                </section>
            </article>
        </div>
    );
}


