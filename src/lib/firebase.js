// import { dev } from '$app/environment'
import { derived, readable } from 'svelte/store'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

let config
config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}
// if (dev) {
//   config = import.meta.env?.VITE_FIREBASE_API_KEY
//     ? {
//         apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//         authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//         projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//         storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//         messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,
//         appId: import.meta.env.VITE_FIREBASE_APP_ID,
//         measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
//       }
//     : { apiKey: 'demo', authDomain: 'demo.firebaseapp.com' }
// } else {
//   // figure out
// }

export const app = readable(initializeApp(config))

function createAuth() {
  let auth
  const { subscribe } = derived(app, ($app, set) => {
    auth = getAuth($app)
    set(auth)
  })
  async function signUp(email, password, profile) {
    const { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } = await import(
      'firebase/auth'
    )
    const res = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(res.user, profile)
    sendEmailVerification(res.user)
    return res
  }
  async function signIn(email, password) {
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    return await signInWithEmailAndPassword(auth, email, password)
  }
  async function signOut() {
    const { signOut: firebaseSignOut } = await import('firebase/auth')
    return await firebaseSignOut(auth)
  }
  // TODO: reimplement if time remaining and make sure to ref https://developers.google.com/identity/branding-guidelines
  // async function signInWithGoogle() {
  //   const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
  //   const provider = new GoogleAuthProvider()
  //   return await signInWithPopup(auth, provider)
  // }
  return {
    subscribe,
    signUp,
    signIn,
    signOut
  }
}

export const auth = createAuth()

function createUser() {
  let user = undefined
  const { subscribe } = derived(auth, async ($auth, set) => {
    set(user)
    const unsubscribe = onAuthStateChanged($auth, userData => {
      user = userData
      set(user)
    })
    return unsubscribe
  })
  async function get() {
    let unsubscribe
    const userData = new Promise(resolve => {
      unsubscribe = subscribe(userData => {
        if (userData !== undefined) {
          if (userData) {
            resolve(userData)
          } else {
            resolve(null)
          }
        }
      })
    })
    return new Promise(resolve => {
      userData.then(result => {
        unsubscribe()
        resolve(result)
      })
    })
  }
  async function loaded() {
    let unsubscribe
    const userData = new Promise(resolve => {
      unsubscribe = subscribe(userData => {
        if (userData !== undefined) {
          if (userData) {
            resolve(true)
          }
        }
      })
    })
    return new Promise(resolve => {
      userData.then(result => {
        unsubscribe()
        resolve(result)
      })
    })
  }
  return {
    subscribe,
    get,
    loaded
  }
}

export const user = createUser()

export const db = derived(app, ($app, set) => {
  set(getFirestore($app))
})

function createStorage() {
  let storage = undefined
  const { subscribe } = derived(app, ($app, set) => {
    storage = getStorage($app)
    set(storage)
  })
  async function uploadFile(file, filePath) {
    await loaded()
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
    const fileRef = ref(storage, filePath)
    return new Promise((resolve, reject) =>
      uploadBytes(fileRef, file)
        .then(() => {
          getDownloadURL(fileRef).then(url => {
            resolve(url)
          })
        })
        .catch(reject)
    )
  }
  async function loaded() {
    let unsubscribe
    const storageData = new Promise(resolve => {
      unsubscribe = subscribe(storageData => {
        if (storageData !== undefined) {
          if (storageData) {
            resolve(true)
          }
        }
      })
    })
    return new Promise(resolve => {
      storageData.then(result => {
        unsubscribe()
        resolve(result)
      })
    })
  }
  return {
    subscribe,
    uploadFile
  }
}

export const storage = createStorage()
