<script setup lang="ts">
// Raíz "/". El contenido depende del host:
//   · admin.nuditoscol.com -> panel de la tienda de patrones (gating en el
//     middleware global host-isolation).
//   · www / cualquier otro -> landing pública.
definePageMeta({ layout: false })

const esAdminHost = useRequestURL().hostname === 'admin.nuditoscol.com'
</script>

<template>
  <AdminPatronesList v-if="esAdminHost" />
  <LandingHome v-else />
</template>
