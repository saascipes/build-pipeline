describe('Stock publisher test', () => {
  it('subscribes to ticker', () => {
    cy.visit('http://localhost:8080/#/')

    cy.get('#ticker').type('IBM')
      .should('have.value', 'IBM');

    cy.get('#btnSubscribe').click();

    cy.get('.tbody').find('tr', { timeout: 15000 }).should('have.length', 1);
  })
})