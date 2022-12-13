<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const prompt = ref('')
const generated = ref('')
const imgs = ref('')
const imgStyle = ref('')
const quill = ref('')
const selection = ref('')

const imageStyles = ref({
  "Dark": "Dark mood",
  "Light": "Light mood",
  "Cartoon": "Cartoon style",
  "Abstract": "Abstract style",
  "Realistic": "Realistic style"
});

const onSelectionChange = async (data) => {
  selection.value = data;
}

const generateInsert = async () => {
  if (selection.value.range.length === 0) {
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
  }
}

const generateEdit = async (instruction) => {
  if (selection.value.range.length > 0) {
    let input = generated.value.slice(selection.value.range.index, selection.value.range.index + selection.value.range.length)

    console.log(input, instruction)
    // let res = await axios.post('http://localhost:8000/api/edit', { input, instruction });

    let res = await axios.post('http://localhost:8000/api/generate', { prompt: instruction + "\n\n" + input });

    console.log(res);
    // generated.value = generated.value.slice(0, selection.value.range.index) + res.data + suffixTxt;
    quill.value.setHTML(generated.value.slice(0, selection.value.range.index) + res.data + generated.value.slice(selection.value.range.index + selection.value.range.length));
  }
}

const generate = async () => {
  let res = await axios.post('http://localhost:8000/api/generate', { prompt: prompt.value  });
  console.log(res);
  generated.value = res.data;
  quill.value.setHTML(res.data);
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
  <div>
    <textarea class="textarea textarea-bordered w-full" placeholder="Prompt"
    :value="prompt"
    @input="event => prompt = event.target.value"
    ></textarea>
    <div class="flex w-full justify-center">
      <button class="flex-initial btn m-3" @click="generate()">Generate</button>
    </div>
    <QuillEditor
      ref="quill"
      toolbar="#my-toolbar"
      theme="snow"
      class="text-gray-500 min-h-[200px]"
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
    <div class="flex w-full justify-center">
      <select v-model="imgStyle" class="flex-initial select select-bordered w-full max-w-xs">
        <option v-for="value, key in imageStyles" :key="key" :value="value">{{ key }}</option>
      </select>
    </div>
    <div class="flex w-full justify-center">
      <button class="flex-initial btn m-3" @click="generateImg()">Generate Images</button>
    </div>
    <div class="flex justify-center">
      <img v-for="img in imgs" :key="img.url" :src="img.url" />
    </div>
  </div>
</template>