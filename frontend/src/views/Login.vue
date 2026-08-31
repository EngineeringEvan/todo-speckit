<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();

const formRef = ref(null);
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

const usernameRules = [(v) => !!v?.trim() || "Username is required."];
const passwordRules = [(v) => !!v?.trim() || "Password is required."];

const handleLogin = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await authServices.loginUser({
      username: username.value,
      password: password.value,
    });

    Utils.setStore("user", res.data);
    router.push({ name: "home" });
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || "Invalid username or password.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card rounded="lg" elevation="2" class="pa-6" width="100%" max-width="450">
      <v-card-title class="text-h5 font-weight-bold text-center mb-4">
        Sign in to your account
      </v-card-title>

      <v-alert
        v-if="errorMessage"
        type="error"
        density="compact"
        class="mb-4"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form ref="formRef" @submit.prevent="handleLogin">
        <v-text-field
          v-model="username"
          label="Username"
          name="username"
          density="comfortable"
          rounded="lg"
          :rules="usernameRules"
          class="mb-2"
          autofocus
        />

        <v-text-field
          v-model="password"
          label="Password"
          name="password"
          type="password"
          density="comfortable"
          rounded="lg"
          :rules="passwordRules"
          class="mb-4"
        />

        <v-btn
          type="submit"
          color="primary"
          variant="elevated"
          class="oc-cta w-100 mb-4"
          :loading="loading"
        >
          Sign in
        </v-btn>

        <div class="text-center text-body-2">
          Don't have an account?
          <router-link :to="{ name: 'register' }" class="text-primary font-weight-medium">
            Register
          </router-link>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>
