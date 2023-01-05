import { cloneDeep } from 'lodash-es'
import { fieldsJson } from '$lib/data'

export const createFields = {
  text: (...fieldNames) => {
    const fieldSection = {}
    fieldNames.forEach(fieldName => {
      fieldSection[fieldName] = cloneDeep(fieldsJson.text)
    })
    return fieldSection
  },
  file: (...fieldNames) => {
    const fieldSection = {}
    fieldNames.forEach(fieldName => {
      fieldSection[fieldName] = cloneDeep(fieldsJson.file)
    })
    return fieldSection
  },
  checkbox: (...fieldNames) => {
    const fieldSection = {}
    fieldNames.forEach(fieldName => {
      fieldSection[fieldName] = cloneDeep(fieldsJson.checkbox)
    })
    return fieldSection
  },
  group: (...fieldNames) => {
    const fieldSection = {}
    fieldNames.forEach(fieldName => {
      fieldSection[fieldName] = cloneDeep(fieldsJson.group)
    })
    return fieldSection
  }
}

export const serialize = {
  toServer: fields => {
    fields = cloneDeep(fields)
    Object.keys(fields).forEach(section => {
      Object.keys(fields[section]).forEach(fieldName => {
        let field = cloneDeep(fields[section][fieldName])
        delete field.error
        switch (field.type) {
          case 'text':
          case 'checkbox':
            break
          case 'file':
            delete field.value
            break
        }
        fields[section][fieldName] = field
      })
    })
    return fields
  },
  fromServer: fields => {
    fields = cloneDeep(fields)
    Object.keys(fields).forEach(section => {
      Object.keys(fields[section]).forEach(fieldName => {
        let field = {
          ...cloneDeep(fields[section][fieldName]),
          error: false
        }
        switch (field.type) {
          case 'text':
          case 'checkbox':
            break
          case 'file':
            field['value'] = {}
            break
        }
        fields[section][fieldName] = field
      })
    })
    return fields
  }
}

export const clearFields = {
  allSections: fields => {
    fields = cloneDeep(fields)
    Object.keys(fields).forEach(section => {
      Object.keys(fields[section]).forEach(fieldName => {
        fields[section][fieldName] = cloneDeep(fieldsJson[fields[section][fieldName].type])
      })
    })
    return fields
  },
  atSection: (fieldSection, ...fieldNames) => {
    fieldSection = cloneDeep(fieldSection)
    if (fieldNames.length === 0) {
      fieldNames = Object.keys(fieldSection)
    }
    fieldNames.forEach(fieldName => {
      fieldSection[fieldName] = cloneDeep(fieldsJson[fieldSection[fieldName].type])
    })
    return fieldSection
  }
}

export const enableErrors = {
  allSections: fields => {
    fields = cloneDeep(fields)
    Object.keys(fields).forEach(section => {
      Object.keys(fields[section]).forEach(fieldName => {
        fields[section][fieldName].error = true
      })
    })
    return fields
  },
  atSection: (fieldSection, ...fieldNames) => {
    fieldSection = cloneDeep(fieldSection)
    if (fieldNames.length === 0) {
      fieldNames = Object.keys(fieldSection)
    }
    fieldNames.forEach(fieldName => {
      fieldSection[fieldName].error = true
    })
    return fieldSection
  }
}

export const disableErrors = {
  allSections: fields => {
    fields = cloneDeep(fields)
    Object.keys(fields).forEach(section => {
      Object.keys(fields[section]).forEach(fieldName => {
        fields[section][fieldName].error = false
      })
    })
    return fields
  },
  atSection: (fieldSection, ...fieldNames) => {
    fieldSection = cloneDeep(fieldSection)
    if (fieldNames.length === 0) {
      fieldNames = Object.keys(fieldSection)
    }
    fieldNames.forEach(fieldName => {
      fieldSection[fieldName].error = false
    })
    return fieldSection
  }
}

export function isValid(formEl) {
  let valid = true
  Array.from(formEl.querySelectorAll('input')).every(input => {
    if (!input.checkValidity()) {
      valid = false
      return false
    }
    return true
  })
  return valid
}
