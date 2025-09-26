<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Doména na prodej</title>
<style>
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(to bottom, #4facfe, #00f2fe);
        color: #fff;
        text-align: center;
        margin: 0;
        padding: 0;
    }
    .container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        padding: 20px;
    }
    h1 {
        font-size: 3em;
        margin-bottom: 0.5em;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    p {
        font-size: 1.2em;
        margin-bottom: 1.5em;
    }
    a.button {
        display: inline-block;
        padding: 12px 25px;
        font-size: 1.2em;
        color: #4facfe;
        background: #fff;
        border-radius: 8px;
        text-decoration: none;
        transition: 0.3s;
        margin-bottom: 20px;
    }
    a.button:hover {
        background: #f0f0f0;
    }
    form {
        display: flex;
        flex-direction: column;
        width: 300px;
        gap: 10px;
    }
    input, textarea {
        padding: 10px;
        border-radius: 6px;
        border: none;
        font-size: 1em;
    }
    button {
        padding: 12px;
        border-radius: 8px;
        border: none;
        background: #fff;
        color: #4facfe;
        font-size: 1.1em;
        cursor: pointer;
        transition: 0.3s;
    }
    button:hover {
        background: #f0f0f0;
    }
    .counter {
        margin-top: 20px;
        font-size: 1em;
        color: #e0e0e0;
    }
</style>
</head>
<body>
<div class="container">
    <h1>Tato doména je na prodej</h1>
    <p>Máte zájem? Napište mi zprávu nebo použijte e-mail:</p>
    <a class="button" href="mailto:vase@adresa.cz">vase@adresa.cz</a>

    <!-- Formulář přes Formspree -->
    <form action="https://formspree.io/f/yourformid" method="POST">
        <input type="text" name="name" placeholder="Vaše jméno" required>
        <input type="email" name="email" placeholder="Váš e-mail" required>
        <textarea name="message" placeholder="Zpráva / dotaz" rows="4" required></textarea>
        <button type="submit">Odeslat</button>
    </form>

    <div class="counter">
        Návštěvy: <span id="visits">0</span>
    </div>
</div>

<script>
// Globální počítadlo návštěv přes Counter API
const counterKey = "domena-prodej";
fetch(`https://api.countapi.xyz/hit/${counterKey}/visits`)
  .then(res => res.json())
  .then(data => {
      document.getElementById('visits').textContent = data.value;
  });
</script>
</body>
</html>
