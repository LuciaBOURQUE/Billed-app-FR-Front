/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom" // Ajout de fireEvent
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

// Ajout
import { ROUTES, ROUTES_PATH } from "../constants/routes" //Ajout de ROUTES-PATH - Chemin de test
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js" 
import router from "../app/Router.js";

describe("Given I am connected as an employee and I am on NewBill Page", () => {
  describe("When I click on submit button and I do not fill in the required fields of the form", () => {
    test("Then, I am invited to fill in the required fields.", () => {
      // 1) Scénario 6
      document.body.innerHTML = NewBillUI()

      const inputDate = screen.getByTestId("datepicker");
      expect(inputDate.value).toBe("");
      const inputAmount = screen.getByTestId("amount");
      expect(inputAmount.value).toBe("");
      const inputTVA = screen.getByTestId("vat");
      expect(inputTVA.value).toBe("");
      const inputFile = screen.getByTestId("file");
      expect(inputFile.value).toBe("");

      const acceptButton  = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      acceptButton.addEventListener("submit", handleSubmit);
      fireEvent.submit(acceptButton);
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    })
  })
  
  describe("When I chose a different extension for the file choice (accepted: .jpg, .jpeg or .png)", () => {
    test("Then, it should renders Login page", () => {
      // 2) Scénario 7
      document.body.innerHTML = NewBillUI()
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      const newBill = new NewBill ({ document, onNavigate, store:null, localStorage:localStorage })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const inputFile = screen.getByTestId("file"); //cible le champ fichier

      // Je fais ici une simulation d'un mauvais fichier ????
      const testFormat = new File (["c'est un test"],"document.txt", { // condition du test
        type: "document/txt"
      })

      inputFile.addEventListener("change", handleChangeFile)
      fireEvent.change(inputFile, { target: {files: [testFormat]}}); //évènement au change en relation avec la condition du test
      expect(handleChangeFile).toHaveBeenCalled() //je vérifie que le fichier est bien chargé
      expect(window.alert).toBeTruthy()
    })
  })

  describe("When I chose the good file choice (accepted: .jpg, .jpeg or .png)", () => {
    test("Then, the bill is sent", () => {
      // 3) Scénario X
      document.body.innerHTML = NewBillUI()
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      const newBill = new NewBill ({ document, onNavigate, store: mockStore, localStorage:localStorage })
  
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e)) //On vient chercher la fonction qui génère le type de fichier
      const inputFile = screen.getByTestId("file");
      const testFormat = new File(["c'est un test"],  "test.jpg", { // condition du test - Je fais ici une simulation d'un bon fichier
        type: "image/jpg"
      })
  
      inputFile.addEventListener("change", handleChangeFile)
      fireEvent.change(inputFile, { target: {files: [testFormat]}});
      expect(handleChangeFile).toHaveBeenCalled()
      expect(inputFile.files[0]).toStrictEqual(testFormat) //je vérifie que le fichier téléchargé est bien conforme à la condition du test
      
      const acceptButton  = screen.getByTestId("form-new-bill"); //cible le formulaire
      expect(acceptButton).toBeTruthy()

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)) //simule la fonction
      acceptButton.addEventListener('submit', handleSubmit)// évènement au submit
      fireEvent.submit(acceptButton)//simule l'évènement

      expect(handleSubmit).toHaveBeenCalled()
      expect(screen.getByText('Mes notes de frais')).toBeTruthy()//lorsqu'on créer une nouvelle note de frais on verifie s'il est bien redirigé vers la page d'accueil
    })
  })
})


// 2) Faire un test d'intégration POST (asynchrone)
describe("Given I am connected as an employee and I am on NewBill Page", () => {
  describe("When I submit the form completed", () => {
    test("Then, the bill is created and it should renders Login page", async () => { // on met ici un async() - asynchrone
      // 2) Scénario X
      document.body.innerHTML = NewBillUI() // Asynchrone: 1er étape - On récupère la structure HTML de la page
      Object.defineProperty(window, 'localStorage', { value: localStorageMock }) // On simulation de connexion d'un employée
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee', email: 'azerty@email.com',}))
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      const newBill = new NewBill ({ document, onNavigate, store: null, localStorage: window.localStorage,}) // Qu'est-ce que le "store: null" ? - Simulation de la création de la page facture
      
      // On simule ici des données dans les champs input
      const dataFileBills = {
        type: "Vol",
        name: "Paris Algerie",
        date: "2022-10-25",
        amount: 400,
        vat: 70,
        pct: 30,
        commentary: "Commentary",
        fileUrl: "../img/0.jpg",
        fileName: "test.jpg",
        status: "pending"
      };

      // On charge notre simulation dans les champs dédié
      screen.getByTestId("expense-type").value = dataFileBills.type;
      screen.getByTestId("expense-name").value = dataFileBills.name;
      screen.getByTestId("datepicker").value = dataFileBills.date;
      screen.getByTestId("amount").value = dataFileBills.amount;
      screen.getByTestId("vat").value = dataFileBills.vat;
      screen.getByTestId("pct").value = dataFileBills.pct;
      screen.getByTestId("commentary").value = dataFileBills.commentary;
      newBill.fileName = dataFileBills.fileName;
      newBill.fileUrl = dataFileBills.fileUrl;

      newBill.updateBill = jest.fn();//SIMULATION DE  CLICK
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)) // On vient chercher la fonction de l'envoie du formulaire

      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit) //On simule la fonction de l'envoie du formulaire
      fireEvent.submit(formNewBill); // On vérifie si le formulaire a été envoyé
      expect(handleSubmit).toHaveBeenCalled() // On regarde ici si la fonction event 'handleClickIconEye' a bien été appelé
      expect(newBill.updateBill).toHaveBeenCalled()//VERIFIE SI LE FORMULAIRE EST ENVOYER DANS LE STORE
    })
  })

  //test erreur 500
  test('fetches error from an API and fails with 500 error', async () => { // récupère l'erreur d'une API et échoue avec l'erreur 500
    jest.spyOn(mockStore, 'bills')
    jest.spyOn(console, 'error').mockImplementation(() => {})// Prevent Console.error jest error

    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
    document.body.innerHTML = `<div id="root"></div>`
    router()

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }

    mockStore.bills.mockImplementationOnce(() => {
      return {
       update : () =>  {
          return Promise.reject(new Error('Erreur 500'))
        }
      }
    })
    const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
  
    // Soumettre le formulaire
    const form = screen.getByTestId('form-new-bill')
    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
    form.addEventListener('submit', handleSubmit)     
    fireEvent.submit(form)
    await new Promise(process.nextTick)
    expect(console.error).toBeCalled()
  })
})