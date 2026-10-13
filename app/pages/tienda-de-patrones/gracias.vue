<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: '¡Gracias por tu compra! — Nuditos' })
</script>

<template>
  <TiendaShell>
    <div style="max-width:460px;margin:0 auto;padding:clamp(48px,8vw,90px) 22px;text-align:center">
      <div style="margin:0 auto;width:64px;height:64px;border-radius:999px;background:#E7F2E4;display:flex;align-items:center;justify-content:center;font-size:30px">✅</div>
      <h1 style="margin:20px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(26px,4vw,36px);color:#4A443D">¡Gracias por tu compra!</h1>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#7d7368">
        Te enviamos un correo con tu patrón. Revisa tu bandeja de entrada (y la carpeta de spam, por si acaso).
        Si es una preventa, te llegará el día del lanzamiento. 💛
      </p>
      <NuxtLink
        to="/tienda-de-patrones"
        class="t-alza"
        style="margin-top:26px;display:inline-block;padding:15px 28px;border-radius:18px;background:#C06B86;color:#fff;font-size:16px;font-weight:800;box-shadow:0 14px 26px -12px rgba(192,107,134,.85)"
      >
        Seguir viendo patrones
      </NuxtLink>
    </div>
  </TiendaShell>
</template>

<style scoped>
.t-alza { transition: transform .18s ease; }
.t-alza:hover { transform: translateY(-2px); }
</style>
