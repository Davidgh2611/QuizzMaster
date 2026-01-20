<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>README - Ultimate Quiz Master Pro</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background-color: #f4f7f6; }
        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; text-align: center; }
        h2 { color: #2980b9; margin-top: 30px; border-left: 5px solid #3498db; padding-left: 15px; }
        .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; margin-right: 5px; }
        .badge-js { background: #f1c40f; color: #000; }
        .badge-html { background: #e67e22; }
        .badge-css { background: #3498db; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .feature-item { background: #ecf0f1; padding: 15px; border-radius: 8px; border-left: 4px solid #2ecc71; }
        code { background: #f8f8f8; padding: 2px 5px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; color: #e74c3c; }
        .tech-stack { display: flex; justify-content: space-around; padding: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 50px; font-size: 0.9em; color: #7f8c8d; }
    </style>
</head>
<body>

<div class="container">
    <h1>🧠 Ultimate Quiz Master Pro</h1>
    <p style="text-align: center; font-style: italic;">La plataforma definitiva de desafíos intelectuales: Logos, Trivia y Geografía.</p>

    <div style="text-align: center; margin: 20px 0;">
        <span class="badge badge-html">HTML5</span>
        <span class="badge badge-css">CSS3 Flexbox/Grid</span>
        <span class="badge badge-js">JavaScript ES6+</span>
    </div>

    <h2>🚀 Descripción del Proyecto</h2>
    <p>
        <strong>Ultimate Quiz Master Pro</strong> es una aplicación web interactiva de juegos de preguntas y respuestas diseñada para ofrecer una experiencia de usuario gamificada y fluida. 
        El proyecto destaca por su sistema dinámico de categorías, permitiendo a los usuarios especializarse en áreas como tecnología, vehículos, gastronomía y geografía mundial.
    </p>

    <h2>✨ Características Principales</h2>
    <div class="feature-grid">
        <div class="feature-item">
            <strong>🎮 Modos de Juego Diversos</strong>
            <p>Incluye Trivia (OpenDB API), Identificación de Logos y Banderas del mundo.</p>
        </div>
        <div class="feature-item">
            <strong>📂 Subcategorías Inteligentes</strong>
            <p>Filtros por sectores (Comida, Ropa, Tech) y continentes (Europa, América, Asia, África).</p>
        </div>
        <div class="feature-item">
            <strong>💰 Sistema de Economía</strong>
            <p>Gana monedas, gira la ruleta diaria y compra Power-Ups (Escudos, 50/50) en la tienda.</p>
        </div>
        <div class="feature-item">
            <strong>🌓 Interfaz Adaptativa</strong>
            <p>Modo oscuro nativo, diseño responsive y sistema de "Combos" por rachas de aciertos.</p>
        </div>
    </div>

    <h2>🛠️ Arquitectura Técnica</h2>
    <ul>
        <li><strong>Frontend:</strong> Arquitectura basada en estados (SPA - Single Page Application) mediante manipulación directa del DOM.</li>
        <li><strong>API Integration:</strong> Conexión con <code>Open Trivia Database</code> para preguntas y <code>Logo.dev</code> para recursos visuales.</li>
        <li><strong>Persistencia:</strong> Uso de <code>localStorage</code> para guardar récords, monedas, inventario y logros del usuario de forma local.</li>
        <li><strong>Diseño:</strong> Grid Layout para menús de categorías y animaciones CSS3 para transiciones de pantalla.</li>
    </ul>

    <h2>📦 Estructura de Archivos</h2>
    <ul>
        <li><code>index.html</code> - Estructura semántica y contenedores de pantallas.</li>
        <li><code>style.css</code> - Diseño moderno, variables de color y animaciones.</li>
        <li><code>script.js</code> - Motor lógico, gestión de cronómetro, ruleta y validación de respuestas.</li>
    </ul>

    <h2>⚙️ Instalación y Uso</h2>
    <ol>
        <li>Clona el repositorio o descarga los archivos.</li>
        <li>Asegúrate de mantener la estructura de carpetas.</li>
        <li>Abre <code>index.html</code> en cualquier navegador moderno (Chrome, Brave, Firefox, Edge).</li>
        <li>¡Empieza a jugar y rompe tu propio récord!</li>
    </ol>

    <div class="footer">
        <hr>
        <p>Desarrollado con ❤️ para amantes de los Quiz y la Programación.</p>
        <p>&copy; 2026 Ultimate Quiz Master Project - Versión 2.0.0</p>
    </div>
</div>

</body>
</html>