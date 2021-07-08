


const handleFormSubmit = (e) => {
    e.preventDefault();
    const formElements = e.target.elements;
    const formElementsLen = formElements.length;
    let formData = {}, i;

    for (i = 0; i < formElementsLen; i++) {
        const useElement = formElements[i];
        formData[useElement.name] = useElement.value;
    }

    console.log(formData);

    fetch('/process_report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    return window.location.href = '/thanks';
}

window.onload = () => {
    const getForms = document.querySelectorAll('form');
    getForms.forEach((element) => element.addEventListener('submit', handleFormSubmit));
}
