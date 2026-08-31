<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();

const formRef = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const loading = ref(false);

const fNameRules = [(v) => !!v?.trim() || "First name is required."];
const lNameRules = [(v) => !!v?.trim() || "Last name is required."];
const usernameRules = [(v) => !!v?.trim() || "Username is required."];
const passwordRules = [
  (v) => !!v?.trim() || "Password is required.",
  (v) => (v && v.length >= 8) || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (v) => !!v?.trim() || "Confirm password is required.",
  (v) => v === password.value || "Passwords do not match.",
];

const handleRegister = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await authServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });

    Utils.setStore("user", res.data);
    router.push({ name: "home" });
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || "Registration failed.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card rounded="lg" elevation="2" class="pa-6" width="100%" max-width="500">
      <v-card-title class="text-h5 font-weight-bold text-center mb-4">
        Create an account
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

      <v-form ref="formRef" @submit.prevent="handleRegister">
        <v-row density="comfortable">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="fName"
              label="First Name"
              name="fName"
              density="comfortable"
              rounded="lg"
              :rules="fNameRules"
              class="mb-2"
              autofocus
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="lName"
              label="Last Name"
              name="lName"
              density="comfortable"
              rounded="lg"
              :rules="lNameRules"
              class="mb-2"
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="email"
          label="Email"
          name="email"
          type="email"
          density="comfortable"
          rounded="lg"
          :rules="emailRules"
          class="mb-2"
        />

        <v-text-field
          v-model="username"
          label="Username"
          name="username"
          density="comfortable"
          rounded="lg"
          :rules="usernameRules"
          class="mb-2"
        />

        <v-text-field
          v-model="password"
          label="Password"
          name="password"
          type="password"
          density="comfortable"
          rounded="lg"
          :rules="passwordRules"
          class="mb-2"
        />

        <v-text-field
          v-model="confirmPassword"
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          density="comfortable"
          rounded="lg"
          :rules="confirmPasswordRules"
          class="mb-4"
        />

        <v-btn
          type="submit"
          color="primary"
          variant="elevated"
          class="oc-cta w-100 mb-4"
          :loading="loading"
        >
          Create account
        </v-btn>

        <div class="text-center text-body-2">
          Already have an account?
          <router-link :to="{ name: 'login' }" class="text-primary font-weight-medium">
            Sign in
          </router-link>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>
