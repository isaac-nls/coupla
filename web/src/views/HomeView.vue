<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-vue';
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
const { getAccessTokenSilently } = useAuth0();

const helperMode = ref(true);
const contentTypes = ref({
  "a letter": 'a letter',
  "an essay": 'an essay',
  "a poem": 'a poem'
});

const promptConfig = ref({
  contentType: 'a letter',
  styleGuide: {
    Formal: 10,
    "Funny/Joking": 0,
    Mysterious: 0
  }
});
const prompt = ref('')
const generated = ref('')
const imgs = ref('')
const imgStyle = ref('')
const quill = ref('')
const selection = ref('')
const isLoading = ref(false)

const imageStyles = ref({
  "Dark": "Dark mood",
  "Light": "Light mood",
  "Cartoon": "Cartoon style",
  "Abstract": "Abstract style",
  "Realistic": "Realistic style"
});

const computedPrompt = computed(() => {
  return `Write ${promptConfig.value.contentType} about ${prompt.value}

Use the following style guide:
###
`
+
Object.keys(promptConfig.value.styleGuide)
.filter(key => promptConfig.value.styleGuide[key] > 0)
.map(key => `${key}: ${promptConfig.value.styleGuide[key] < 10 ? promptConfig.value.styleGuide[key] : 100}/10`)
.join("\n")
+
`\n###\n`

});

const onSelectionChange = async (data) => {
  selection.value = data;
}

const generateInsert = async () => {
  if (selection.value.range.length === 0) {
    isLoading.value = true;
    // cursor is positioned, but no selection
    let promptTxt = prompt.value + "\n\n\n" + generated.value.slice(0, selection.value.range.index);
    if (!promptTxt.endsWith(" ")) {
      promptTxt += " ";
    }

    let suffixTxt = generated.value.slice(selection.value.range.index);
    if (!suffixTxt.startsWith(" ")) {
      suffixTxt = " " + suffixTxt;
    }

    console.log(promptTxt, suffixTxt)
    let res = await axios.post('http://localhost:8000/api/generate', { prompt: promptTxt, suffix: suffixTxt  });
    generated.value = generated.value.slice(0, selection.value.range.index) + res.data + suffixTxt;
    quill.value.setHTML(generated.value.slice(0, selection.value.range.index) + res.data + suffixTxt);
    isLoading.value = false;
  }
}

const generateEdit = async (instruction) => {
  if (selection.value.range.length > 0) {
    isLoading.value = true;
    let input = generated.value.slice(selection.value.range.index, selection.value.range.index + selection.value.range.length)

    console.log(input, instruction)
    // let res = await axios.post('http://localhost:8000/api/edit', { input, instruction });

    let res = await axios.post('http://localhost:8000/api/generate', { prompt: instruction + "\n\n" + input });

    console.log(res);
    // generated.value = generated.value.slice(0, selection.value.range.index) + res.data + suffixTxt;
    quill.value.setHTML(generated.value.slice(0, selection.value.range.index) + res.data + generated.value.slice(selection.value.range.index + selection.value.range.length));
    isLoading.value = false;
  }
}

const generate = async () => {
  console.log(import.meta.env)
  isLoading.value = true;

  // get an API access token
  const token = await getAccessTokenSilently()
  console.log(token);

  let res = await axios.post(`${import.meta.env.VITE_API_ENDPOINT}generatetext`, { prompt: computedPrompt.value  }, { headers: { Authorization: `Bearer ${token}` } });
  console.log(res);
  generated.value = res.data;
  quill.value.setHTML(res.data.trim());
  isLoading.value = false;
}

const generateImg = async () => {
  // distill response using openAI
  let distilled = await axios.post('http://localhost:8000/api/generate', { prompt: `Describe an image in one sentence to accompany the following article as a DALLE image generator prompt. Do not include people. Stylish. News Article. Flashy. Attention grabbing. ${imgStyle.value}:\n${generated.value}` });

  console.log("Distilled", distilled)

  // generate 5 images
  let res = await axios.post('http://localhost:8000/api/generateImage', { prompt: distilled.data + " Do not include people. Stylish. News Article. Flashy. Attention grabbing. " + imgStyle.value  });
  imgs.value = res.data;
}
</script>

<template>
  <div class="flex justify-center text-gray-700">
    <div class="flex-initial w-2/3 max-w-[800px]">
      <span>Write...</span>
      <select v-model="promptConfig.contentType" class="select select-ghost ml-4">
            <option v-for="value, key in contentTypes" :key="key" :value="value">{{ key }}</option>
          </select>
      <div>about...</div>
      <textarea class="flex-initial textarea textarea-bordered w-full" placeholder="Prompt"
      :value="prompt"
      @input="event => prompt = event.target.value"
      ></textarea>

      In the following style
      <div class="flex my-2" v-for="val, key in promptConfig.styleGuide" :key="key">
        <span class="mr-2 min-w-[100px]">{{key}}</span><input type="range" min="0" max="10" v-model="promptConfig.styleGuide[key]" class="range" step="1" />
      </div>

      <textarea class="flex-initial textarea textarea-bordered w-full" placeholder="Prompt"
      
      :value="computedPrompt"
      ></textarea>
      <div class="flex flex-initial w-full justify-center">
        <button class="flex-initial btn m-3" :class="[isLoading ? 'loading': '']" @click="generate()">Generate</button>
      </div>
      <QuillEditor
        :readOnly="isLoading"
        ref="quill"
        toolbar="#my-toolbar"
        theme="snow"
        class="text-gray-500 text-xl min-h-[200px] flex-initial"
        v-model:content="generated"
        contentType="text"
        @selectionChange="onSelectionChange"
      >
        <template #toolbar>
          <div id="my-toolbar">
            <!-- Add buttons as you would before -->
            <button class="ql-bold"></button>
            <button class="ql-italic"></button>

            <!-- But you can also add your own -->
            <button id="ai-fill" class="ql-stroke" @click="generateInsert()">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <line x1="12" y1="12" x2="12" y2="12.01" />  <path d="M12 2a4 10 0 0 0 -4 10a4 10 0 0 0 4 10a4 10 0 0 0 4 -10a4 10 0 0 0 -4 -10" transform="rotate(45 12 12)" />  <path d="M12 2a4 10 0 0 0 -4 10a4 10 0 0 0 4 10a4 10 0 0 0 4 -10a4 10 0 0 0 -4 -10" transform="rotate(-45 12 12)" /></svg>
            </button>

            <!-- <button id="ai-formalise" class="ql-stroke" @click="generateEdit('Make the text really goofy as if the writer was drunk.')">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="6 21 21 6 18 3 3 18 6 21" />  <line x1="15" y1="6" x2="18" y2="9" />  <path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />  <path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" /></svg>
            </button> -->

            <span class="ql-picker" @click="generateEdit('Make the following text funny and humourous:')">
              <span class="ql-picker-label">FUNNY</span>
            </span>
            <span class="ql-picker" @click="generateEdit('Make the following text as formal as possible:')">
              <span class="ql-picker-label">FORMAL</span>
            </span>
            <span class="ql-picker" @click="generateEdit('Make the following text lighthearted and casual:')">
              <span class="ql-picker-label">CASUAL</span>
            </span>
            <span class="ql-picker" @click="generateEdit('Give the following text a dark and mysterious tone:')">
              <span class="ql-picker-label">DARK</span>
            </span>

            <!-- <select class="ql-custom tooltip" title="hello">
              <option value="1">value1</option>
              <option value="2">value2</option>
              <option value="3">value3</option>
              <option value="4">value4</option>
            </select> -->
          </div>
        </template>
      </QuillEditor>
      <div class="mt-5 flex justify-between">
        <div class="flex-grow">
          <select v-model="imgStyle" class="select select-bordered w-full max-w-xs">
            <option v-for="value, key in imageStyles" :key="key" :value="value">{{ key }}</option>
          </select>
        </div>
        <div class="flex-initial">
          <button class="btn" @click="generateImg()">Generate Images</button>
        </div>
      </div>

      <div class="mt-5 flex flex-initial justify-center">
        <img v-for="img in imgs" :key="img.url" :src="img.url" />
      </div>
    </div>
  </div>
</template>