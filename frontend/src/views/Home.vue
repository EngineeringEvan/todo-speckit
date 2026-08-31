<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = ref(null);
const loading = ref(false);

onMounted(() => {
  user.value = Utils.getStore("user");
});

const handleLogout = async () => {
  loading.value = true;
  try {
    await authServices.logoutUser();
  } catch (err) {
    // Proceed with client logout even if backend call fails
  } finally {
    Utils.removeItem("user");
    loading.value = false;
    router.push({ name: "login" });
  }
};
</script>

<template>
  <v-container class="py-10">
    <v-card rounded="lg" elevation="2" class="pa-6 max-width-600 mx-auto">
      <h1 class="text-h4 mb-4">
        Welcome, {{ user?.fName || user?.username || "User" }}!
      </h1>
      <p class="text-body-1 mb-6">
        You are successfully authenticated. Todo lists and tasks will be available in the upcoming dashboard.
      </p>
      <v-btn
        color="secondary"
        variant="elevated"
        class="oc-cta"
        :loading="loading"
        @click="handleLogout"
      >
        Sign out
      </v-btn>
    </v-card>
  </v-container>
</template>
