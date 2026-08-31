<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();

const user = computed(() => Utils.getStore("user"));
const displayName = computed(() => {
  const current = user.value;
  if (!current) {
    return "";
  }
  return current.fName || current.username || "User";
});

const handleLogout = async () => {
  try {
    await authServices.logoutUser();
  } catch {
    // Continue client logout even if the API call fails
  } finally {
    Utils.removeItem("user");
    router.push({ name: "login" });
  }
};
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <span class="me-4">{{ displayName }}</span>
    <v-btn variant="text" class="oc-cta" @click="handleLogout">Sign out</v-btn>
  </v-app-bar>
</template>
