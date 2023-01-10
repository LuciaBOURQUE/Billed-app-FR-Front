/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom" // Ajout de fireEvent
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js"; // Ajout de ROUTES - Chemin de test
import {localStorageMock} from "../__mocks__/localStorage.js";

// Ajout
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js"; // Qu'est-ce que c'est ?
jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee'}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      //to-do write expect expression
      expect(windowIcon).toBeTruthy()
      expect(windowIcon.classList.contains('active-icon')).toBe(true);

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a > b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I am on Dashboard page and I click on the icon eye", () => {
    test("A modal should open", () => {
      // Scénario 4 - ligne 14 du fichier "Bills"(containers)
      document.body.innerHTML = BillsUI({ data: bills }) // On récupère ici le code HTML de la page pour interagir avec

      Object.defineProperty(window, localStorage, { value: localStorageMock }) // On simule ici des données dans le localStorage
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'})) // On simule ici un utilisateur employé qui est connecté
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname })} // Navigation vers la route bills
      const dashboard = new Bills({ document, onNavigate, store: null, localStorage:localStorage }) // On créer une facture

      const handleClickIconEye = jest.fn(() => dashboard.handleClickIconEye) // On récupère la fonction event dans le fichier Bills
      const iconEye = screen.queryAllByTestId('icon-eye')[0];
      $.fn.modal = jest.fn(); // Mock de la modale qui permet d'afficher la modale - mais SAVOIR a quoi ça sert (test si on l'enlève)
      
      iconEye.addEventListener('click', handleClickIconEye)
      fireEvent.click(iconEye); // On regarde ici si l'event de 'icon' à bien fonctionner
      expect(handleClickIconEye).toHaveBeenCalled(); // On regarde ici si la fonction event 'handleClickIconEye' a bien été appelé
      
      const modale = screen.getByTestId('modaleFile'); // On vérifie ici que la modale s'affiche bien en montrant un élément dedans
      expect(modale).toBeTruthy();
    })
  })

  describe("When I am on Dashboard page and I clicked on the NewBill button", () => {
    test("I am sent to a form to fill out or I can enter my information for a new expense report", () => {
      // Scénario 5 - ligne 20 du fichier "Bills"(containers)
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname })}
      const dashboard = new Bills({ document, onNavigate, store: null, bills:bills, localStorage:localStorage })

      const handleClickNewBill = jest.fn(() => dashboard.handleClickNewBill);
      const buttonNewBill = screen.getByTestId('btn-new-bill')

      buttonNewBill.addEventListener('click', handleClickNewBill)
      fireEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
})

// Faire un test d'intégration GET (asynchrone)
describe("Given I am connected as an employee", () => {
  describe("When I get bills", () => { // Quand je demande de récupérer des factures
    test("Then it should render bills", async () => { // Ensuite, il devrait afficher les factures
      const bills = new Bills ({ document, onNavigate, store:mockStore, localStorage:window.localStorage}); // On récupère les factures dans le Store

      const getBills = jest.fn(() => bills.getBills()); // On vient chercher la fonction qui récupère la liste des factures
      const value = await getBills(); // Vérification

      expect(getBills).toHaveBeenCalled()
      expect(value.length).toBe(4);
    })
  })

  // Test erreur
  describe("When an error occurs on API", () => { //Lorsqu'une erreur se produit sur l'API
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills')
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.appendChild(root)
      router()
    })
  
    test("Then i fetch the invoices in the api and it fails with a 404 error", async () => {//Ensuite, je récupère les factures dans l'api et cela échoue avec une erreur 404
      mockStore.bills.mockImplementationOnce(() => {//changement du comportement pour générer une erreur
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
  })
})